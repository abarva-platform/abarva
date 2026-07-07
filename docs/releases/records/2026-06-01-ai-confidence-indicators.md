# 2026-06-01-ai-confidence-indicators — AI Confidence Indicators

## Release ID

`2026-06-01-ai-confidence-indicators`

## Status

`candidate`

## Plain-English Summary

Adds a shared AI confidence indicator that shows high, medium, or low confidence with a visible rationale. The structured agent response renderer and inline agent recommendation surface now render the shared confidence indicator where confidence metadata exists.

## Layer Impact

`global-control-lane`: Shared AI output disclosure UI for confidence and rationale.

## Client Applicability

- All clients: Agent response and inline recommendation surfaces use the shared confidence indicator.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/abarva/AIConfidenceIndicator.tsx`
- `src/components/abarva/__tests__/AIConfidenceIndicator.test.tsx`
- `src/components/agent/AgentResponse.tsx`
- `src/components/agents/AgentInlineRecommendation.tsx`

## QA / Validation

- PASS: `npx jest src/components/abarva/__tests__/AIConfidenceIndicator.test.tsx --runInBand`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check`

## Rollout Plan

Merge to `main` and deploy through the normal Vercel control-plane release. The indicator renders automatically in the wired AI output surfaces.

## Rollback Plan

Revert the PR to remove the shared confidence primitive and renderer integrations. No data migration or tenant data change is involved.

## Audit Evidence

- PR URL
- CI checks
- Local component test, typecheck, release check, and diff hygiene output

## Known Gaps

This slice creates and wires the shared indicator in high-fanout surfaces. Remaining module-specific cards still need complete audit-catalog retrofit coverage.
