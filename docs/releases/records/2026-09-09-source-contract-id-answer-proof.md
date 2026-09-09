# 2026-09-09-source-contract-id-answer-proof - Source Contract Id Answer Proof

## Release ID

`2026-09-09-source-contract-id-answer-proof`

## Status

`candidate`

## Plain-English Summary

Source aVa answers now preserve public Source contract identifiers that use multi-part contract codes, while continuing to scrub internal record identifiers before rendering. Contract 360 answers also include selected contract header fields so renewal timing, notice period, auto-renewal, and owner details can be reported from governed Source context, even when serialized surface fields arrive as numeric strings.

## Layer Impact

Layer 4 - Products, `global-control-lane`: updates Source aVa answer shaping and public render safety only. No tenant intake, adapter, canonical model, schema, or data-plane mutation is included.

## Client Applicability

- All clients: Source Workspace and Contract 360 aVa users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/ava-answer/public-answer-scrub.ts`
- `src/lib/ava-answer/render-layer-shaper.ts`
- `src/lib/agent/product-truth/runtime-guard.ts`
- `src/lib/intelligence/answer/answer-safety.ts`
- `src/lib/source/ava/source-workspace-visual-answer.ts`
- `src/lib/agent/product-truth/__tests__/runtime-guard.test.ts`
- `src/lib/intelligence/answer/__tests__/answer-safety.test.ts`
- `src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts`
- `docs/releases/records/2026-09-09-source-contract-id-answer-proof.md`

## QA / Validation

Pass before merge:

- `npm test -- --runTestsByPath src/lib/intelligence/answer/__tests__/answer-safety.test.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts src/lib/ava-answer/__tests__/render-layer-shaper.test.ts`
- `npm test -- --runTestsByPath src/lib/agent/product-truth/__tests__/runtime-guard.test.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts src/lib/ava-answer/__tests__/render-layer-shaper.test.ts src/lib/intelligence/answer/__tests__/answer-safety.test.ts`
- `npm test -- --runTestsByPath src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts src/lib/agent/product-truth/__tests__/runtime-guard.test.ts src/lib/ava-answer/__tests__/render-layer-shaper.test.ts src/lib/intelligence/answer/__tests__/answer-safety.test.ts`
- `npx eslint src/lib/ava-answer/public-answer-scrub.ts src/lib/ava-answer/render-layer-shaper.ts src/lib/intelligence/answer/answer-safety.ts src/lib/source/ava/source-workspace-visual-answer.ts src/lib/intelligence/answer/__tests__/answer-safety.test.ts src/lib/source/ava/__tests__/source-workspace-visual-answer.test.ts`
- `npm run release:check`

## Rollout Plan

Merge through PR and deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow
- Approved image digest: assigned by the deploy workflow
- ACA runtime invariant: required after deploy
- Worker image invariant: required after deploy
- Feature/env flag update path: none
- Live signed-in proof required: Source Contract 360 aVa answers preserve the selected public contract ID and report governed contract header fields from Source context.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow. There are no schema, data, or migration rollback steps.

## Audit Evidence

Add PR URL, CI run, ACA deploy run, runtime invariant artifact, and signed-in Source Contract 360 aVa proof after merge/deploy.

## Known Gaps

This release does not attach governed source document files to contracts or change Source Evidence tab document-file coverage.
