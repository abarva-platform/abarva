# 2026-06-01-agent-chat-action-approval — Agent Chat Action Approval Boundary

## Release ID

`2026-06-01-agent-chat-action-approval`

## Status

`candidate`

## Plain-English Summary

Shared agent chat surfaces now show an explicit human-approval boundary for agent-suggested actions. The UI makes clear that agent recommendations, follow-up chips, and chat-prepared actions are proposals only until a named person approves the write, submission, or external action.

## Layer Impact

Global control lane. This changes shared AI chat rendering behavior across agent surfaces and strengthens the reusable human-in-the-loop control for consequential action paths.

## Client Applicability

- All clients: Applies to shared agent chat surfaces that render through AgentDock, AtlasDrawer, or AgentResponse follow-up actions.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/agent/AgentActionApprovalNotice.tsx` adds the reusable in-chat approval boundary.
- `src/components/agent/AgentDock.tsx` renders the boundary next to the shared dock composer.
- `src/components/shell/AtlasDrawer.tsx` renders the boundary in embedded and overlay drawer composers.
- `src/components/agent/AgentResponse.tsx` renders the boundary before structured follow-up action chips.
- `docs/security/ai-surface-control-catalog.json` catalogs the human-approval control on the shared chat surfaces.
- Focused tests cover dock rendering, response follow-up rendering, and Atlas drawer static wiring.

## QA / Validation

- Pass: `npx jest src/components/agent/__tests__/AgentDock.test.tsx src/components/agent/__tests__/AgentResponse.test.tsx src/components/shell/__tests__/AtlasDrawerCanvasContinuity.test.ts --runInBand`
- Pass: `npx eslint src/components/agent/AgentActionApprovalNotice.tsx src/components/agent/AgentDock.tsx src/components/agent/AgentResponse.tsx src/components/shell/AtlasDrawer.tsx`
- Pass: `npm run audit:ai-surface-controls`
- Pass: `./node_modules/.bin/tsc --noEmit --pretty false`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: `git diff --check`

## Rollout Plan

Merge to `main`. The boundary becomes active on the next Vercel deployment for shared agent chat surfaces.

## Rollback Plan

Revert the PR to remove the shared approval notice and return AgentDock, AtlasDrawer, and AgentResponse follow-up rendering to their prior behavior.

## Audit Evidence

- PR URL: pending.
- Local validation output: focused Jest, focused ESLint, TypeScript, AI surface catalog audit, release check, and diff whitespace check passed locally on 2026-06-01.
- CI evidence: pending.

## Known Gaps

This is a visible chat-control boundary. It does not persist new approval records, alter existing tool authorization checks, or complete external legal sign-off.
