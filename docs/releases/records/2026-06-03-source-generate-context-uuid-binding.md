# 2026-06-03-source-generate-context-uuid-binding — Re-bind Source generation to persisted event UUIDs

## Release ID

`2026-06-03-source-generate-context-uuid-binding`

## Status

`candidate`

## Plain-English Summary

This change fixes a live Source regression where clicking `Generate with Sentinel` on the Apex AMS event failed with `invalid input syntax for type uuid: "apex-retail-ams-outsourcing-2026"`, and then fell through to `No source event with slug apex-retail-ams-outsourcing-2026`. The generation path was binding to the golden route slug instead of a persisted Source event UUID, and in some environments the legacy seeded event did not yet have a matching `source_events` row. We now re-bind generation to the persisted UUID and materialize the seeded Apex event into `source_events` on first write when that row is missing, so AI draft generation uses a real substrate-backed event instead of the shell slug.

## Layer Impact

- `global-control-lane`: shared Source generation behavior changes for all tenants that use slug-based Source routes or legacy seeded events. The fix is in the server-side binding layer and affects how generation APIs resolve persisted event identity before touching artifact substrate.
- `client-data-lane`: first-write materialization now creates the missing `source_events` row and canvas substrate for seeded legacy events instead of requiring a separate manual backfill before generation can work.

## Client Applicability

- All clients: Source artifact generation on slug-based routes
- Specific clients: Apex Retail immediately benefits because the failing golden event route is `apex-retail-ams-outsourcing-2026`
- Internal only: No
- Public/demo only: No
- Feature flag: None

## Changes Included

- `src/lib/source/queries.ts`
  - export `isUuid`
  - add `resolveSourceEventUuidForClient(eventId, clientKey)`
  - add `ensurePersistedSourceEventForClient(eventId, clientKey, createdByUserId)` for first-write seed materialization
- `src/lib/source/agent-generation/context-binder.ts`
  - re-bind non-UUID event ids to the persisted event UUID before substrate reads
  - fail closed if a persisted UUID cannot be resolved safely
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude/route.ts`
  - require tenancy before generation context binding
  - materialize the legacy seeded event into `source_events` before generation when needed
- `src/lib/source/agent-generation/__tests__/context-binder.test.ts`
  - regression coverage for the Apex golden-slug -> persisted-UUID binding path
- `src/lib/source/__tests__/create-sourcing-event-scaffold.test.ts`
  - regression coverage for first-write materialization of the Apex seeded event

## QA / Validation

- `./node_modules/.bin/jest src/lib/source/agent-generation/__tests__/context-binder.test.ts src/lib/source/__tests__/queries-tenant-scope.test.ts --runInBand`
  - Passed before materialization follow-up (`2` suites, `8` tests)
- `./node_modules/.bin/jest src/lib/source/agent-generation/__tests__/context-binder.test.ts src/lib/source/__tests__/queries-tenant-scope.test.ts src/lib/source/__tests__/create-sourcing-event-scaffold.test.ts --runInBand`
  - Passed after materialization follow-up (`3` suites, `16` tests)
- `./node_modules/.bin/tsc --noEmit --pretty false`
  - Blocked by pre-existing baseline issue: `tests/accessibility/public-axe.spec.ts(1,24): error TS2307: Cannot find module '@axe-core/playwright'`
- Live browser repro before fix:
  - Source strategy page loaded under Apex Retail / Carlos Rivera
  - `Generate with Sentinel` failed with `invalid input syntax for type uuid: "apex-retail-ams-outsourcing-2026"`

## Rollout Plan

Merge to `main`, let Vercel deploy production, then rerun the authenticated Source browser retest starting with Strategy Memo generation on `/source/events/apex-retail-ams-outsourcing-2026?stage=strategy`.

## Rollback Plan

Revert this commit or PR. The change is isolated to Source generation context binding and does not include schema or migration changes.

## Audit Evidence

- This release record
- Focused Jest output for:
  - `src/lib/source/agent-generation/__tests__/context-binder.test.ts`
  - `src/lib/source/__tests__/queries-tenant-scope.test.ts`
- Live browser reproduction captured in Codex session:
  - authenticated Apex Retail session
  - failure message on Strategy Memo generation

## Known Gaps

- Repo-wide TypeScript is still blocked by the pre-existing `@axe-core/playwright` accessibility test dependency gap.
- Post-deploy live retest still required to confirm the production route is fixed end-to-end.
