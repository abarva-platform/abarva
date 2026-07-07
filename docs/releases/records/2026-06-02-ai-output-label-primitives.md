# 2026-06-02-ai-output-label-primitives — AI Output Label Primitives

## Release ID

`2026-06-02-ai-output-label-primitives`

## Status

`candidate`

## Plain-English Summary

Strengthens the shared AI output label and suggestion-frame primitives so AI drafts, suggestions, and pending-review output are visible and accessible. Applies the suggestion frame to high-leverage non-Tower reactive panels so streamed agent reasoning cards are clearly marked as AI suggestions that require human validation before action.

## Layer Impact

`global-control-lane`: Shared presentational controls for AI output disclosure now apply across AgentDock turns and non-Tower reactive reasoning panels. No data-plane, private client data, admin setup, or package dependency behavior changes.

## Client Applicability

- All clients: Shared AI output disclosure primitives and non-Tower reactive panel labels apply globally.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/abarva/AILabel.tsx`
- `src/components/abarva/AISuggestionFrame.tsx`
- `src/components/agent/__tests__/AgentDock.test.tsx`
- `src/components/abarva/__tests__/AILabel.test.tsx`
- `src/components/abarva/__tests__/AISuggestionFrame.test.tsx`
- `src/components/programs/NexusReactivePanel.tsx`
- `src/components/programs/__tests__/NexusReactivePanel.test.ts`
- `src/components/intelligence/SentinelReactivePanel.tsx`
- `src/components/intelligence/__tests__/SentinelReactivePanel.test.tsx`
- `src/components/source/SourcingReactivePanel.tsx`
- `src/components/source/__tests__/SourcingReactivePanel.test.tsx`
- `src/components/source/SourcePortfolioReactivePanel.tsx`
- `src/components/source/__tests__/SourcePortfolioReactivePanel.test.tsx`

## QA / Validation

- PASS: `npx jest src/components/abarva/__tests__/AILabel.test.tsx src/components/abarva/__tests__/AISuggestionFrame.test.tsx src/components/agent/__tests__/AgentDock.test.tsx src/components/programs/__tests__/NexusReactivePanel.test.ts src/components/intelligence/__tests__/SentinelReactivePanel.test.tsx src/components/source/__tests__/SourcingReactivePanel.test.tsx src/components/source/__tests__/SourcePortfolioReactivePanel.test.tsx --runInBand` (7 suites, 71 tests; repo emitted existing duplicate manual mock warnings)
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main` and deploy through the normal Vercel control-plane release. The primitives render automatically where the shared AgentDock and reactive panels are used.

## Rollback Plan

Revert the PR to remove the primitive refinements and reactive-panel frame wiring. No migrations, data changes, package changes, or private data-plane rollback is required.

## Audit Evidence

- PR URL
- CI checks
- Local focused Jest output
- `git diff --check`
- `npm run release:check -- --base origin/main --head HEAD`

## Known Gaps

This T205/T208-light slice does not retrofit Tower, private data-plane surfaces, admin setup/data-load, or consequential-action approval gates.
