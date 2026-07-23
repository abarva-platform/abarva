# 2026-07-23-moves-chat-streaming-rich-answer — Moves Streaming Rich Answer Visibility

## Release ID

`2026-07-23-moves-chat-streaming-rich-answer`

## Status

`candidate`

## Plain-English Summary

Moves aVa chat now attaches the structured chart/table answer while streamed prose is still arriving. This prevents the rich answer section from waiting on a long-lived response stream before becoming visible.

## Layer Impact

- Product runtime UI: updates only the Moves phase chat drawer.
- AI/rendering guardrail: preserves the shared `AvaAnswerPacket` renderer path while making it visible during streaming.
- Data plane: no schema, loader, active-pointer, or tenant-data mutation.

## Client Applicability

- All clients: Moves phase workspace users.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`

## QA / Validation

- PASS: `npx prettier --write src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx docs/releases/records/2026-07-23-moves-chat-streaming-rich-answer.md`
- PASS: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
- PASS: targeted ESLint for changed files
- PASS: `npm run release:check`
- PASS: `git diff --check`
- NOT RUN: signed-in Moves browser proof until this candidate merges and deploys through ACA main

## Rollout Plan

Merge through a PR to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the image, then rerun the signed-in Moves phase chat proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: captured after the ACA main deploy completes
- ACA runtime invariant: required before live claim
- Worker image invariant: required by the deploy proof
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Revert the PR or redeploy the previous known-good ACA image. The change is UI-only and does not alter database state, active pointers, migrations, or tenant data.

## Audit Evidence

Inspect the PR diff, targeted Jest output, release check output, ACA deploy run, runtime invariant evidence, and signed-in browser screenshots for the Moves phase chat drawer.

## Known Gaps

No deploy or signed-in proof is captured until this candidate merges and the ACA main workflow completes.
