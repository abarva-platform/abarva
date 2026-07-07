# 2026-06-01-agent-chat-citation-gap — Agent Chat Citation Gap Guard

## Release ID

`2026-06-01-agent-chat-citation-gap`

## Status

`candidate`

## Plain-English Summary

Shared agent chat surfaces now warn users when an agent gives substantive prose without visible citation markup. The same citation-gap threshold used by structured `AgentResponse` rendering is centralized and applied to AgentDock and AtlasDrawer chat turns.

## Layer Impact

Global control lane. This changes shared AI chat rendering behavior across agent surfaces and strengthens the reusable citation guard for AI-assisted responses.

## Client Applicability

- All clients: Applies to shared agent chat surfaces that render through AgentDock or AtlasDrawer.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/agent/citation-gap.ts` centralizes substantive-text and citation-markup detection.
- `src/components/agent/CitationGapNotice.tsx` adds a reusable citation-gap notice.
- `src/components/agent/AgentResponse.tsx` uses the shared citation-gap helper and notice.
- `src/components/agent/AgentDock.tsx` shows the notice on substantive uncited agent turns.
- `src/components/shell/AtlasDrawer.tsx` shows the notice on substantive uncited completed and streaming agent responses.
- `docs/security/ai-surface-control-catalog.json` catalogs citation-gap controls on AgentResponse, AgentDock, and AtlasDrawer.
- `scripts/audit/ai-surface-control-catalog.mjs` validates `citation-gap` as an allowed control kind.
- Focused tests cover detection and AgentDock rendering behavior.

## QA / Validation

- Pass: `npx jest src/lib/agent/__tests__/citation-gap.test.ts src/components/agent/__tests__/AgentDock.test.tsx src/components/agent/__tests__/AgentResponse.test.tsx --runInBand`
- Pass: `npx eslint src/lib/agent/citation-gap.ts src/components/agent/CitationGapNotice.tsx src/components/agent/AgentDock.tsx src/components/shell/AtlasDrawer.tsx src/components/agent/AgentResponse.tsx`
- Pass: `npm run audit:ai-surface-controls`
- Pass: `./node_modules/.bin/tsc --noEmit --pretty false`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: `git diff --check`

## Rollout Plan

Merge to `main`. The guard becomes active on the next Vercel deployment for shared agent chat surfaces.

## Rollback Plan

Revert the PR to remove the shared chat citation-gap notice and return AgentDock, AtlasDrawer, and AgentResponse to their prior citation-gap behavior.

## Audit Evidence

- PR URL: pending.
- Local validation output: focused Jest, focused ESLint, TypeScript, AI surface catalog audit, release check, and diff whitespace check passed locally on 2026-06-01.
- CI evidence: pending.

## Known Gaps

This is a visible guard, not full sentence-level grounding enforcement. Follow-on work still needs deeper citation generation and coverage across every non-AgentDock chat renderer.
