# 2026-07-20-tower-ava-governed-answer-contract — Tower aVa Governed Answer Contract

## Release ID

`2026-07-20-tower-ava-governed-answer-contract`

## Status

`candidate`

## Plain-English Summary

Tower aVa now has a stricter governed-advisor prompt contract. It treats the Tower question contract, governed measures, facts, relationships, gaps, and value-claim gate as the authority for answers. Claude can provide executive interpretation, but it is explicitly forbidden from inventing metrics, upgrading evidence, merging projection fallback values into governed results, or emitting hidden chart/code payloads.

## Layer Impact

- `global-control-lane`: Tower chat answer generation and answer-contract scoring are tightened for all tenants using the CIO Tower chat endpoint.
- `client-data-lane`: No schema, seed, migration, or tenant data change.

## Client Applicability

- All clients: Tower aVa prompt and contract-scoring behavior applies to the shared Tower chat path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/cio-tower/answer.ts`
  - Promotes the Tower prompt to `cio_tower_advisor_prompt_v3`.
  - Adds explicit authority order: governed measures, governed facts/relationships, projection fallbacks, then derived gaps.
  - Requires observed / interpretation / action separation before writing.
  - Treats projection fallback as planning-grade only.
  - Requires chart, graph, ranking, trend, portfolio, and comparison asks to use `tables[]` with supported rows instead of fenced chart blocks or hidden JSON.
  - Adds validation for code-fence / hidden visual payload leaks and Markdown-table leakage inside the answer field.
- `src/lib/cio-tower/answer-contract.ts`
  - Scores chart asks as requiring structured chart-ready table data.
- `src/lib/cio-tower/__tests__/answer.test.ts`
  - Locks the governed prompt contract and hidden-visual validation.
- `src/lib/cio-tower/__tests__/answer-contract.test.ts`
  - Locks chart-as-structured-data scoring.

## QA / Validation

- pass: `npm test -- --runTestsByPath src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/answer-contract.test.ts` passed with 20/20 tests. Jest emitted existing duplicate manual mock warnings for markdown/GFM mocks, but the focused Tower suite passed.
- pass: `npx eslint src/lib/cio-tower/answer.ts src/lib/cio-tower/answer-contract.ts src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/answer-contract.test.ts`
- pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- pass: `npm run release:check`
- not-run: live signed-in Tower proof is pending merge and ACA deploy.
- not-run: Tower budget/value question proof is pending merge and ACA deploy.
- not-run: Tower chart/trend/ranking question proof is pending merge and ACA deploy.
- not-run: post-deploy proof for no fenced chart blocks, hidden chart JSON, raw IDs, source keys, or unsupported value language is pending merge and ACA deploy.
- not-run: post-deploy proof that chart/trend/ranking requests include board-readable structured rows is pending merge and ACA deploy.

## Rollout Plan

Merge to `main`, allow the repo-owned ACA main deploy workflow to build and deploy the digest-pinned image, then run Tower live signed-in proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: pending merge/deploy
- ACA runtime invariant: required after deploy
- Worker image invariant: not applicable
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Revert the PR and redeploy the previous passing ACA image through the repo-owned deploy workflow. No data rollback is required.

## Audit Evidence

- PR URL: pending
- Focused tests: pending
- Release check: pending
- ACA revision / image digest: pending after deploy
- Signed-in Tower proof: pending after deploy

## Known Gaps

This PR does not add a native Tower chat chart renderer. It makes the model output chart-ready governed table data so the existing renderer does not depend on model-authored chart code or hidden JSON.
