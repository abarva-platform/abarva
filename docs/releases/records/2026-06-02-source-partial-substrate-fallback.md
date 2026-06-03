# 2026-06-02-source-partial-substrate-fallback — Fill missing Source stage scaffolds for partial legacy events

## Release ID

`2026-06-02-source-partial-substrate-fallback`

## Status

`candidate`

## Plain-English Summary

This release closes a legacy-event failure mode where a Source event could have only early-stage substrate rows persisted, causing later stages like Pricing and BAFO to render as empty even though the canonical scaffold knew what should exist there. The page now merges persisted rows onto the virtual scaffold per artifact, gate criterion, and evidence requirement so partially scaffolded events still render deterministic placeholders for missing later-stage content.

## Layer Impact

- `global-control-lane`: Source event canvas rendering and scaffold fallback behavior are shared application behavior for every tenant.
- `client-data-lane`: no schema or stored-data change; this only changes how existing client-scoped Source substrate is read and merged at render time.

## Client Applicability

- All clients: receive resilient Source stage rendering for legacy or partially scaffolded events.
- Specific clients: none.
- Internal only: none.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/source/canvas-substrate/scaffold.ts`: adds `mergeMissingVirtualScaffold()` to overlay persisted substrate rows onto the canonical virtual scaffold.
- `src/app/(maestro)/source/events/[eventId]/page.tsx`: uses per-stage scaffold merging when an event has partial persisted substrate instead of falling back only when all three substrate lists are empty.
- `src/lib/source/canvas-substrate/__tests__/scaffold.test.ts`: regression coverage for missing later-stage rows and persisted-row preservation.
- `src/lib/source/__tests__/create-sourcing-event-scaffold.test.ts`: aligns scaffold warnings and write-adapter mocks with the current Azure/Postgres data-plane path.
- `src/lib/source/queries.ts`: keeps scaffold failures visible as non-fatal warnings.

## QA / Validation

- PASS: `npm test -- --runInBand src/lib/source/canvas-substrate/__tests__/scaffold.test.ts src/lib/source/__tests__/create-sourcing-event-scaffold.test.ts`
- PASS: `git diff --check`
- INFO: `npx tsc --noEmit --pretty false` is currently blocked by a repo-baseline missing module error in `tests/accessibility/public-axe.spec.ts` for `@axe-core/playwright`; unrelated to this slice.

## Rollout Plan

Merge to `main`, then deploy the Next.js app to production through the standard Vercel production deployment path. No database migration or one-off backfill is required for the page-render fix to take effect.

## Rollback Plan

Revert the application commit. No stored data changes are introduced by this slice.

## Audit Evidence

After merge, inspect the PR diff, CI output, Vercel deployment, and a signed-in Source session on a partially scaffolded legacy event that previously showed empty Pricing or BAFO stages.

## Known Gaps

This slice fixes read-time rendering for partial substrate but does not backfill missing persisted rows into the database. A future maintenance slice can still choose to backfill legacy events.
