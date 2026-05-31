# 2026-05-31-move-business-case-ai-ops-renderer — AI Ops Cost In Board-Grade Move Decks

## Release ID

`2026-05-31-move-business-case-ai-ops-renderer`

## Status

`candidate`

## Plain-English Summary

Adds AI operating cost to the board-grade Move Estimate and Master Move Dossier decks. When a Move supplies AI ops inputs, the decks now show a three-axis cost view: build cost, business-change cost, and AI run cost. They also surface unit economics, pricing-tier warnings, and model-tier drift warnings in plain CFO-readable language.

## Layer Impact

- `global-control-lane`: Extends shared board-grade Move artifact renderers and view-models for all clients.

## Client Applicability

- All clients: Any originated Move with AI operating-cost inputs receives the new board-grade display.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None. Existing Moves without AI ops input render an explicit "AI Ops cost not modeled yet" gap instead of implying zero run cost.

## Changes Included

- `move-estimate-model.ts` projects AI ops summary fields into the Estimate & Financial Model view-model.
- `move-estimate-renderer.ts` renders the three-axis cost view, unit economic, annual AI ops breakdown, and pricing/model-tier warnings.
- `move-master-dossier-model.ts` projects AI ops summary fields into the Roadmap & Tower handoff section.
- `move-master-dossier-renderer.ts` renders the same three-axis cost view in the assembled dossier.
- Tests assert the AI ops panels render for an Apex Store Labor AI fixture.

## QA / Validation

- Pass: `npx jest src/lib/programs/expert-kernel/exports/board-grade/__tests__/move-board-grade-estimate-model.test.ts src/lib/programs/expert-kernel/exports/board-grade/__tests__/move-board-grade-master-dossier.test.ts --runInBand` (62 tests).
- Pass: `npx eslint src/lib/programs/expert-kernel/exports/board-grade/move-estimate-model.ts src/lib/programs/expert-kernel/exports/board-grade/move-estimate-renderer.ts src/lib/programs/expert-kernel/exports/board-grade/move-master-dossier-model.ts src/lib/programs/expert-kernel/exports/board-grade/move-master-dossier-renderer.ts src/lib/programs/expert-kernel/exports/board-grade/__tests__/move-board-grade-estimate-model.test.ts src/lib/programs/expert-kernel/exports/board-grade/__tests__/move-board-grade-master-dossier.test.ts`.
- Pass: `npm run qa:agent-quality:corpus` (60 cases across Apex, Meridian, First Capital, and SkyHarbor).
- Pass: `npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main` and deploy through the normal Vercel production path. No database migration is required; this is a renderer/view-model enhancement over the optional AI ops fields already added to the expert kernel.

## Rollback Plan

`gh pr revert <PR number>` removes the renderer additions. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Local validation: pending.

## Known Gaps

The requested `MoveBusinessCaseCard.tsx` component does not exist in this codebase; this slice updates the live generic board-grade Move decks instead of creating an orphaned component. The vendor scorecard, BAFO clause, pattern-library, and Tower ledger slices remain separate Wave 1 PRs.
