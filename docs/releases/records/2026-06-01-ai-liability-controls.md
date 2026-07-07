# 2026-06-01-ai-liability-controls — Human Decision Accountability Controls

## Release ID

`2026-06-01-ai-liability-controls`

## Status

`candidate`

## Plain-English Summary

Adds a shared human-decision accountability spine for AI-assisted recommendations. AbarVa agents remain advisors: they can recommend, explain, and challenge, but the client decision owner must review evidence, missing data, assumptions, alternatives, and required approvals before any consequential action.

## Layer Impact

- `global-control-lane`: Shared prompt, sanitizer, evidence-packet, high-risk classifier, model-risk, and export-control language apply across agent and export surfaces.
- `internal-admin`: Adds legal/pilot control documentation for counsel and operator review.

## Client Applicability

- All clients: Agent language, prompt posture, Source artifact quality rules, and board/export watermark language.
- Specific clients: None.
- Internal only: Counsel checklist and model risk register baseline.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/ai-liability/human-decision-controls.ts`
- `src/app/api/chat/agent/route.ts`
- `src/lib/atlas/llm.ts`
- `src/lib/sentinel/orchestrator.ts`
- `src/lib/source/exports/artifact-standards.ts`
- `src/lib/source/exports/dispatch.ts`
- `src/lib/programs/expert-kernel/exports/board-pack/html-renderer.ts`
- `src/lib/programs/expert-kernel/exports/board-pack/pdf-renderer.tsx`
- `src/lib/programs/expert-kernel/exports/financial-model-xlsx.ts`
- `docs/legal/AI_DECISION_SUPPORT_CONTROLS.md`

## QA / Validation

- PASS: `npx jest src/lib/ai-liability/__tests__/human-decision-controls.test.ts`
- PASS: `npx jest src/lib/source/exports/__tests__/artifact-standards.test.ts`
- PASS: `npx jest src/lib/source/exports/__tests__/dispatch.test.ts`
- PASS: `./node_modules/.bin/tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main and deploy through the standard Vercel production path. No database migration is required. The prompt and sanitizer controls become active when the app route deploys; export watermark and Source artifact quality controls become active with the same deploy.

## Rollback Plan

Revert the release commit. No migration rollback is required. If an urgent partial rollback is needed, remove the prompt/sanitizer imports from the agent route and Atlas/Sentinel modules while leaving the docs and tests in place for follow-up.

## Audit Evidence

- PR diff and CI results.
- Jest outputs for the human-decision controls and Source artifact standards.
- Release check output.
- Optional browser crawl of Tower/Source/Intelligence chat to confirm advisor wording and no autonomous-decision phrasing.

## Known Gaps

Persistent per-tenant decision-owner storage and live legal/admin approval workflow are represented by deterministic contracts in this slice. The next slice should bind those packets to persisted audit events once the pilot approval tables are finalized.
