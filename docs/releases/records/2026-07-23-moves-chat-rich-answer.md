# 2026-07-23-moves-chat-rich-answer — Moves aVa Rich Answer Rendering

## Release ID

`2026-07-23-moves-chat-rich-answer`

## Status

`candidate`

## Plain-English Summary

Moves phase chat now renders aVa responses with the shared answer renderer when deterministic phase-readiness data is available. Assistant turns still stream normal prose, then add a governed chart and scorecard after the response completes.

## Layer Impact

- Product runtime UI: updates the Moves phase workspace chat drawer only.
- Module read model: uses existing phase tallies and next-phase readiness inputs already passed to the client; no schema, loader, or data-plane mutation is included.
- AI/rendering guardrail: parsed stream artifacts are captured and rendered as structured UI instead of leaking raw sentinel text.

## Client Applicability

- All clients: Moves users on the phase workspace receive the rendering improvement.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- `src/lib/programs/moves-chat-answer-packet.ts`
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`

## QA / Validation

- PASS: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
- PASS: targeted ESLint for changed files
- PASS: `git diff --check`
- PASS: `npm run release:check`
- NOT RUN: signed-in Moves browser proof until this candidate merges and deploys through ACA main

## Rollout Plan

Merge through a PR to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the image, then verify the live signed-in Moves phase route.

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
