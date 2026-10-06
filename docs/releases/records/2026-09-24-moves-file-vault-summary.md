# 2026-09-24-moves-file-vault-summary — Moves File Vault Summary Copy

## Release ID

`2026-09-24-moves-file-vault-summary`

## Status

`candidate`

## Plain-English Summary

The Moves Files & Evidence vault now describes its downloads area as current Move files, final-ready deliverables, and review items instead of implying that every listed item is client-final. The summary also names how many current files are final-ready DOCX/PPTX deliverables, how many deliverables still need review, and how many model files are present.

## Layer Impact

- Layer 4 / Products (`global-control-lane`): Updates the Moves Files & Evidence UI copy and summary counts. No source, adapter, canonical, data-plane, or tenant input files are changed.

## Client Applicability

- All clients: Applies to the shared Moves product surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/FileCabinetPanel.tsx`
- `src/components/strategic-moves/__tests__/FileCabinetPanel.labels.test.ts`
- Moves E2E smoke report updates under `reports/moves-e2e-operating-smoke/20260923T222629Z/`

## QA / Validation

- `npm run test -- --runTestsByPath src/components/strategic-moves/__tests__/FileCabinetPanel.labels.test.ts --runInBand` — passed.
- `npx eslint src/components/strategic-moves/FileCabinetPanel.tsx src/components/strategic-moves/__tests__/FileCabinetPanel.labels.test.ts` — passed.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the product image.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, open Files & Evidence and verify the Downloads summary no longer over-claims that all current files are client-final.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow.

## Audit Evidence

- PR URL, CI, ACA deploy run, runtime invariant output, and signed-in browser proof after merge.

## Known Gaps

This release changes the Files vault presentation truthfulness only. It does not change artifact generation, approval state, storage state, or content quality scoring.
