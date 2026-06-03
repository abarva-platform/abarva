# 2026-06-03-source-generate-context-uuid-binding — Re-bind Source generation to persisted event UUIDs

## Release ID

`2026-06-03-source-generate-context-uuid-binding`

## Status

`candidate`

## Plain-English Summary

This change fixes a live Source regression where clicking `Generate with Sentinel` on the Apex AMS event failed with `invalid input syntax for type uuid: "apex-retail-ams-outsourcing-2026"`. The generation path was sometimes binding to the golden route slug instead of the persisted Source event UUID. We now re-bind the generation context to the persisted event UUID before any substrate reads or writes run, so AI draft generation uses the real event row instead of the shell slug.

## Layer Impact

- `global-control-lane`: shared Source generation behavior changes for all tenants that use slug-based Source routes or legacy seeded events. The fix is in the server-side binding layer and affects how generation APIs resolve persisted event identity before touching artifact substrate.

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
- `src/lib/source/agent-generation/context-binder.ts`
  - re-bind non-UUID event ids to the persisted event UUID before substrate reads
  - fail closed if a persisted UUID cannot be resolved safely
- `src/lib/source/agent-generation/__tests__/context-binder.test.ts`
  - regression coverage for the Apex golden-slug -> persisted-UUID binding path

## QA / Validation

- `./node_modules/.bin/jest src/lib/source/agent-generation/__tests__/context-binder.test.ts src/lib/source/__tests__/queries-tenant-scope.test.ts --runInBand`
  - Passed (`2` suites, `8` tests)
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
