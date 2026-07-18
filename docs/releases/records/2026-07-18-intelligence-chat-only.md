# 2026-07-18-intelligence-chat-only — Intelligence Chat-Only Surface

## Release ID

`2026-07-18-intelligence-chat-only`

## Status

`candidate`

## Plain-English Summary

The Intelligence page now opens as a focused aVa chat experience instead of a split chat-plus-canvas workspace. Home/Knowledge remains the owner of the deterministic cockpit and context canvas, while Intelligence is reserved for asking questions, receiving executive-grade answers, using follow-up prompts, and exporting the session. The old static right-canvas implementation is removed from the Intelligence client module instead of being hidden behind layout state.

## Layer Impact

- UI/control plane: adds a reusable chat-only layout mode to the shared agent dock and opts Intelligence into that mode.
- Product experience: removes the static right briefing canvas from the Intelligence route so users are not shown a second Home-style panel beside the chat.
- Client bundle: removes the old Intelligence right-panel chart/canvas implementation from the route module; chat response charts/tables still render from the aVa answer packet.
- Data/model path: no data ingestion, retrieval, prompt, or model-governance behavior changes.

## Client Applicability

- All clients: yes, for the Intelligence page shell.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/agent/AgentDock.tsx`: adds `layout="chat-only"` support.
- `src/components/ava-chat/AvaChatShell.tsx`: passes the layout mode through to the shared dock.
- `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx`: uses the chat-only layout for Intelligence and removes the old deterministic briefing canvas code from this route.
- `src/components/intelligence-advisory/__tests__/AdvisoryIntelligencePage.test.tsx`: updates expectations so Intelligence is verified as chat-only and no longer renders canvas tabs.

## QA / Validation

- `npx eslint src/components/agent/AgentDock.tsx src/components/ava-chat/AvaChatShell.tsx src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx src/components/intelligence-advisory/__tests__/AdvisoryIntelligencePage.test.tsx` — passed.
- `npm test -- --runTestsByPath src/components/intelligence-advisory/__tests__/AdvisoryIntelligencePage.test.tsx --runInBand` — passed, with pre-existing duplicate Jest manual mock warnings.
- `npx tsc --noEmit --pretty false` — local first run exhausted Node heap before reporting type diagnostics.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — passed.

## Rollout Plan

Merge through the protected GitHub PR path. The change becomes live after the repo-owned Azure Container Apps main deploy builds the merged SHA image, deploys it to `ca-abarva-web-lab-eastus`, assigns 100% traffic to the healthy revision, and signed-in browser proof confirms `/intelligence` renders chat-only.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: to be recorded after deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, `/intelligence` must show chat-only aVa with no right-side briefing canvas.

## Rollback Plan

Revert the PR or set Intelligence back to the default dock layout. No database, migration, or data rollback is required.

## Audit Evidence

- PR URL: pending.
- Focused test output: local candidate validation.
- Live signed-in screenshot: pending after deploy.

## Known Gaps

Live production proof is pending until this candidate is merged and deployed through the ACA lane.
