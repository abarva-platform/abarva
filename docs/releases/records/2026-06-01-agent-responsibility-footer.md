# 2026-06-01-agent-responsibility-footer — Agent Responsibility Footer

## Release ID

`2026-06-01-agent-responsibility-footer`

## Status

`candidate`

## Plain-English Summary

Adds a shared AI responsibility footer and renders it persistently in the shared AgentDock and AtlasDrawer chat shells. The footer states that AI may produce errors and that users remain responsible for decisions taken based on the output.

## Layer Impact

`global-control-lane`: Shared agent chat UI disclosure across migrated chat surfaces.

## Client Applicability

- All clients: AgentDock-backed and AtlasDrawer-backed chat surfaces render the disclaimer.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/abarva/AIResponsibilityFooter.tsx`
- `src/components/abarva/__tests__/AIResponsibilityFooter.test.tsx`
- `src/components/agent/AgentDock.tsx`
- `src/components/agent/__tests__/AgentDock.test.tsx`
- `src/components/shell/AtlasDrawer.tsx`
- `src/components/shell/__tests__/AtlasDrawerCanvasContinuity.test.ts`

## QA / Validation

- PASS: `npx jest src/components/abarva/__tests__/AIResponsibilityFooter.test.tsx src/components/agent/__tests__/AgentDock.test.tsx src/components/shell/__tests__/AtlasDrawerCanvasContinuity.test.ts --runInBand`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check`

## Rollout Plan

Merge to `main` and deploy through the normal Vercel control-plane release. The footer appears automatically in AgentDock and AtlasDrawer surfaces without a data migration.

## Rollback Plan

Revert the PR to remove the shared footer primitive and chat-shell integrations. No database or tenant data rollback is required.

## Audit Evidence

- PR URL
- CI checks
- Local component/source tests, typecheck, release check, and diff hygiene output

## Known Gaps

This slice covers chat surfaces that use AgentDock or AtlasDrawer. Any future custom chat shell must adopt the shared footer or be caught by a follow-on audit-catalog CI gate.
