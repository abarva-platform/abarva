# 2026-06-24-intelligence-focused-workspace-tabs — Intelligence Focused Chat Workspace

## Release ID

`2026-06-24-intelligence-focused-workspace-tabs`

## Status

`candidate`

## Plain-English Summary

This release cleans up the Intelligence Ask experience after the shared chat-shell rollout. The left side becomes a quiet GPT/Claude-like conversation rail that preserves prompt history without dumping long answers into the rail. The right side becomes an Intelligence workspace with tabs for the answer, evidence, experts, corpus, and artifacts. The shared aVa mark now uses the same slanted blue V geometry from the AbarVa brand symbol instead of a typed `V`.

## Layer Impact

- `global-control-lane`: shared frontend behavior and shared aVa visual identity.
- Frontend only: no data migration, no semantic-layer migration, no tenant data change, no model prompt change, and no retrieval path change.
- Shared component impact: `AvaAskMark` is used by Home, Intelligence, Tower, Source, Moves, and shared agent surfaces, so the brand-V fix applies consistently.

## Client Applicability

- All clients: yes, for signed-in tenants using the affected shared Ava/AgentDock surfaces.
- Tenant-specific data: none.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/intelligence/ask/SentinelReasoningCards.tsx`: converts the right-side Intelligence workspace into tabs for answer, evidence, experts, corpus, and artifacts; keeps long answer content on the canvas instead of cluttering the chat rail.
- `src/components/agent/AgentDock.tsx`: adds a focused variant for advisor-style surfaces, preserving dock modes while suppressing operational labels/noise inside the rail.
- `src/components/agent-answer/AvaAskMark.tsx`: replaces the typed `V` with inline SVG geometry from the AbarVa slanted brand V.
- Tests now assert the shared brand-V mark exists and that Intelligence history remains visible while answer detail renders in the workspace.

## QA / Validation

- `passed`: `npx eslint src/components/agent-answer/AvaAskMark.tsx src/components/agent-answer/__tests__/AvaAsk.test.tsx src/components/home/know/__tests__/HomeKnowAsk.test.tsx src/components/agent/AgentDock.tsx 'src/app/(maestro)/intelligence/ask/SentinelReasoningCards.tsx' 'src/app/(maestro)/intelligence/ask/__tests__/SentinelReasoningCards.test.tsx'`
- `passed`: `npx jest --runTestsByPath 'src/components/agent-answer/__tests__/AvaAsk.test.tsx' 'src/components/home/know/__tests__/HomeKnowAsk.test.tsx' 'src/app/(maestro)/intelligence/ask/__tests__/SentinelReasoningCards.test.tsx' --runInBand` — 3 suites / 9 tests passed. Jest still reports existing duplicate manual mock warnings unrelated to this release.
- `passed`: `npm run audit:ai-surface-controls`
- `blocked`: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --project tsconfig.json` remains blocked by pre-existing repo-wide missing declarations/modules for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`; no touched-file TypeScript errors remain.
- `passed`: `npm run release:check`
- `pending`: signed-in browser proof after ACA deployment.

## Rollout Plan

Merge to `main`; deploy through the repo-owned Azure Container Apps main workflow. Validate `/intelligence/ask` signed in for SkyHarbor and one additional tenant, then spot-check Home/Source/Moves/Tower ask marks for the shared slanted-V mark.

## Deployment Authority

- Approved runtime: Azure Container Apps only.
- Repo-owned main deploy workflow required.
- No Vercel deployment, branch-local ACA mutation, or non-main image tag is authorized for `app.abarva.ai`.
- ACA runtime invariant after deploy: template image, active revision image, and 100% traffic revision must match the approved main digest.

## Rollback Plan

Revert this PR and redeploy the previous approved main digest through the ACA main deploy workflow. No data rollback required.

## Audit Evidence

- PR URL: to be added.
- CI run: to be added.
- ACA revision: to be added after deploy.
- Browser proof: to be added after signed-in verification.

## Known Gaps

This release improves the Intelligence interaction model and shared branding. It does not redesign the backend semantic retrieval layer or raise answer-quality scoring by itself.
