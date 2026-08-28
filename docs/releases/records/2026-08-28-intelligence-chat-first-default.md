# 2026-08-28-intelligence-chat-first-default — Restore Intelligence Chat-First Default

## Release ID

`2026-08-28-intelligence-chat-first-default`

## Status

`candidate`

## Plain-English Summary

Restores the default Intelligence surface to the aVa-led chat experience. The evidence and projection
preview remain available for explicit operator review, but they no longer take over the default page
or sit above the advisor by default.

## Layer Impact

**Layer 4 — Intelligence product projection.** Presentation-only change. No intake, adapter,
canonical, registry, data-plane, or retrieval state changes.

## Client Applicability

- All clients: yes
- Specific clients: none
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx` restores the chat-only shell.
- `src/app/(maestro)/intelligence/page.tsx` limits the ECL context-pack preview to explicit
  ECL provider requests through the shared provider resolver and labels it as a non-default preview.

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/components/intelligence-advisory/__tests__/AdvisoryIntelligencePage.test.tsx src/components/intelligence-advisory/__tests__/resolveAssistantAnswerText.test.ts --runInBand` — 10 tests passed.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`.
- Pass: `npx eslint 'src/app/(maestro)/intelligence/page.tsx' src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx src/components/intelligence-advisory/__tests__/AdvisoryIntelligencePage.test.tsx`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow will build and deploy the
resulting image.

## Deployment Authority

- Repo-owned deploy workflow: approved for this session.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: captured by the deploy workflow after merge.
- ACA runtime invariant: verify after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: verify the default Intelligence page is chat-first after deploy.

## Rollback Plan

Revert the PR to restore the prior dock/canvas default.

## Audit Evidence

- PR, CI checks, merge commit, deploy run, ACA runtime invariant, and signed-in Intelligence page
  proof.

## Known Gaps

- The advisory section canvas remains in the codebase for a later explicit context/evidence surface.
- This does not redesign the Intelligence page; it only restores the default interaction contract.
