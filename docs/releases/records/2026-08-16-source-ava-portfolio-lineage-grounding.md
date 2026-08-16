# 2026-08-16-source-ava-portfolio-lineage-grounding — Source aVa portfolio and lineage grounding

## Release ID

`2026-08-16-source-ava-portfolio-lineage-grounding`

## Status

`candidate`

## Plain-English Summary

This release tightens Source aVa grounding so portfolio chart requests and contract lineage questions are answered from the governed Source read models that power the Source workspace. It keeps the response contract prompt-driven: Claude receives the right grounding and instructions before answering, rather than relying on a post-processing scrubber after the answer is generated.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source aVa receives stronger Source-specific prompt discipline for portfolio charts and contract lineage questions.
- Canonical model projections: the aVa portfolio block now includes effective-category rollups derived from `source.contract_360`, and the contract block includes the source-system evidence map used to explain Contract 360 lineage.
- Source adapters: no adapter, schema, or data-load change.

## Client Applicability

- All clients: yes, for Source chat turns using the shared aVa route.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source surface routing only; no new flag.

## Changes Included

- `src/app/api/chat/agent/route.ts`
- `src/lib/source/facts/view/ava-portfolio-grounding-context.ts`
- `src/lib/source/facts/view/ava-contract-grounding-context.ts`
- Route and grounding regression tests for tenant-key fallback, portfolio category rollups, and contract source-system lineage.

## QA / Validation

- `npm test -- --runTestsByPath src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts src/lib/source/facts/view/__tests__/ava-portfolio-grounding-context.test.ts src/lib/source/facts/view/__tests__/ava-contract-grounding-context.test.ts src/lib/source/ava/__tests__/answer-quality-gate.test.ts --runInBand` — passed.
- `npx eslint src/app/api/chat/agent/route.ts src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts src/lib/source/facts/view/ava-portfolio-grounding-context.ts src/lib/source/facts/view/__tests__/ava-portfolio-grounding-context.test.ts src/lib/source/facts/view/ava-contract-grounding-context.ts src/lib/source/facts/view/__tests__/ava-contract-grounding-context.test.ts` — passed.
- Typecheck and release check are required before merge.
- Live aVa 50-question hard QA is required after deployment before marking live-proven.

## Rollout Plan

Merge through the protected GitHub PR flow. The repo-owned ACA main deploy workflow builds and deploys the exact merge SHA to the shared Product/Lab web runtime.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: produced by the repo-owned deploy workflow.
- ACA runtime invariant: required before live-proof.
- Worker image invariant: required before live-proof.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source aVa hard QA after deploy.

## Rollback Plan

Revert the merge commit and allow the repo-owned ACA main deploy workflow to redeploy the previous behavior. No data migration or schema rollback is required.

## Audit Evidence

- PR URL after opening.
- GitHub checks and ACA deploy workflow run.
- Runtime invariant JSON from the deploy workflow.
- Live signed-in aVa hard-QA output after deployment.

## Known Gaps

- This release does not perform live upload-to-parse-to-persist readback for proposal or evidence documents.
- It does not add the Source-substrate proof CLI for every Source/Cube/Contract 360 figure.
