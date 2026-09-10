# 2026-09-10 Source Contract Answer Export Contract

## Release ID

`2026-09-10-source-contract-answer-export-contract`

## Status

`candidate`

## Plain-English Summary

Selected-contract Source chat answers now receive a stricter answer contract for optimization, negotiation, export, and client-sample prompts. When the page has contract-grain grounding, the model is instructed before generation to return a short executive read plus one lever table with the governed row fields, and to avoid extra unrelated sections unless the user asks for them.

## Layer Impact

Layer 4 — Products (`global-control-lane`): Source chat prompt composition and browser page context now preserve contract-opportunity negotiation fields and apply a selected-contract export answer shape.

Layer 3 — Canonical model (`global-control-lane`, read-only): no schema or data mutation. Existing contract, opportunity, and calculation reads remain the source of truth.

## Client Applicability

- All clients: yes, for selected-contract Source chat surfaces when governed contract grounding is available.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/facts/view/ava-contract-grounding-context.ts`
- `src/app/api/chat/agent/route.ts`
- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`
- Focused tests for the contract grounding and route prompt wiring.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/source/facts/view/__tests__/ava-contract-grounding-context.test.ts src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts` — pass.
- `npx tsc --noEmit --pretty false` — pass.
- `npx eslint src/app/api/chat/agent/route.ts src/lib/source/facts/view/ava-contract-grounding-context.ts src/app/(maestro)/source/preview/workspace/buildViewModel.ts src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts src/lib/source/facts/view/__tests__/ava-contract-grounding-context.test.ts` — pass.
- `git diff --check` — pass.

## Rollout Plan

Open a pull request, squash merge to `main`, then allow the repo-owned Azure Container Apps main deploy workflow to build and deploy the new web image. No migration or data-build job is required for this release.

## Deployment Authority

- Repo-owned deploy workflow: required for shared web runtime rollout.
- Shared runtime mutators: none in this PR.
- Approved image digest: captured after the repo-owned deploy workflow completes.
- ACA runtime invariant: prove web template image and 100%-traffic revision image match the approved digest.
- Worker image invariant: no worker change expected; verify required worker images remain on the approved digest if the deploy workflow reports them.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, selected-contract Source chat should return the export-ready lever answer from governed rows.

## Rollback Plan

Revert the squash commit and redeploy through the repo-owned ACA main deploy workflow. No database rollback is required because this release does not alter schema or tenant data.

## Audit Evidence

- Pull request URL.
- Repo-owned ACA deploy workflow run.
- Runtime invariant readback.
- Focused test output.
- Signed-in Source chat proof for a selected contract with governed optimization rows.

## Known Gaps

This release does not create new contract evidence, benchmarks, finance confirmations, document page text, or calculation runs. It only makes the chat answer shape use the governed fields that already exist in the selected-contract read path.
