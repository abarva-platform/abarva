# 2026-06-03-source-write-substrate-repair — On-demand Source substrate repair for legacy events

## Release ID

`2026-06-03-source-write-substrate-repair`

## Status

`candidate`

## Plain-English Summary

Legacy Source events could render virtual Gate, Pricing, and BAFO surfaces in the UI without having matching database substrate rows behind them. When a user tried to mark a gate criterion met, promote a stage, or update artifact status, the write route looked for missing rows and failed even though the canvas appeared interactive. This release repairs that gap by idempotently scaffolding the canonical Source substrate for the persisted event before those write paths run.

## Layer Impact

- `global-control-lane`: shared Source write-route behavior changes for stage promotion, gate criterion mutation, artifact status updates, and AI artifact generation.

## Client Applicability

State exactly who receives the change.

- All clients: Source users on legacy or partially scaffolded events.
- Specific clients: Apex Retail was the live proving case.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/source/[eventId]/stage/route.ts`
- `src/app/api/v1/source/[eventId]/gate-criteria/[criterionId]/state/route.ts`
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/status/route.ts`
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude/route.ts`

## QA / Validation

- PASS — `npx eslint src/app/api/v1/source/[eventId]/stage/route.ts src/app/api/v1/source/[eventId]/gate-criteria/[criterionId]/state/route.ts src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/status/route.ts src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude/route.ts`
- PASS — `npx jest src/lib/source/__tests__/create-sourcing-event-scaffold.test.ts --runInBand`
- PASS — `npm run release:check -- --base origin/main --head HEAD`
- NOT RUN — live browser proof after merge: mark a Strategy criterion met on `SRC-004`, reload, and confirm gate state plus `source_event_activity` entry persist.

## Rollout Plan

Merge to `main` and let the normal Vercel production deploy roll out. No migration or feature flag is required because the change only calls the existing idempotent substrate scaffold helper on write routes.

## Rollback Plan

Revert this PR. The rollback returns Source write routes to their prior behavior, where legacy partial events require manual backfill to make gate and artifact writes succeed.

## Audit Evidence

- PR URL
- CI status for this PR
- Vercel production deployment linked to the merge commit
- Live Source retest showing Strategy gate mutation persists after reload
- `source_event_activity` row for `gate_criterion_updated` on the Apex event

## Known Gaps

Chat truncation still needs a live debugging pass. This release does not change Source chat rendering.
