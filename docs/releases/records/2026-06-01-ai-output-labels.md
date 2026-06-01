# 2026-06-01-ai-output-labels — AI Output Labels

## Release ID

`2026-06-01-ai-output-labels`

## Status

`candidate`

## Plain-English Summary

Adds shared UI primitives that visibly mark AI-generated output as `AI Draft`, `Suggested`, or `Pending Review`, then applies those labels to the shared AgentDock, AtlasDrawer assistant turns, the structured agent response renderer, inline agent recommendations, generated program artifact previews, and Source executive decision summaries.

## Layer Impact

`global-control-lane`: Shared AI output disclosure components apply across product surfaces that render agent or AI-generated content.

## Client Applicability

- All clients: AI output disclosure labels apply globally.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/abarva/AILabel.tsx`
- `src/components/abarva/AISuggestionFrame.tsx`
- `src/components/abarva/__tests__/AILabel.test.tsx`
- `src/components/abarva/__tests__/AISuggestionFrame.test.tsx`
- `src/components/agent/AgentResponse.tsx`
- `src/components/agent/AgentDock.tsx`
- `src/components/agents/AgentInlineRecommendation.tsx`
- `src/components/shell/AtlasDrawer.tsx`
- `src/components/programs/ProgramArtifactCanvas.tsx`
- `src/components/source/SourceExecutiveDecisionSummaryPanel.tsx`

## QA / Validation

- PASS: `npx jest src/components/abarva/__tests__/AILabel.test.tsx src/components/abarva/__tests__/AISuggestionFrame.test.tsx src/components/agent/__tests__/AgentDock.test.tsx --runInBand`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main` and deploy with the normal Vercel control-plane release. The labels render automatically where the shared renderers are used.

## Rollback Plan

Revert the PR to remove the shared label/frame components and their targeted integrations. No data migration or tenant data change is involved.

## Audit Evidence

- PR URL
- CI checks
- Local component test, typecheck, release check, and diff hygiene output

## Known Gaps

This slice establishes the shared primitives and high-fanout integrations. Follow-on slices still need to retrofit confidence, citations, approval gates, and remaining module-specific AI elements from the audit catalog.
