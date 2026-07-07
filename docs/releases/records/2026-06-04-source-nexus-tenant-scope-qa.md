# 2026-06-04-source-nexus-tenant-scope-qa — Source Nexus Tenant Scope QA

## Release ID

`2026-06-04-source-nexus-tenant-scope-qa`

## Status

`candidate`

## Plain-English Summary

This change tightens Source assistant routing so an Apex-prefixed Source event id cannot cause the Apex-only Source intelligence adapter to run for a non-Apex active client such as Lakeshore. If an event-scoped Source assistant request cannot resolve an event for the active client, the route now returns a 404 instead of falling back to seeded context.

## Layer Impact

- `global-control-lane`: Updates the shared Source Nexus ask route and adds tenant-scoping regression coverage. No schema, data-loader, Azure infrastructure, or client data changes are included.

## Client Applicability

- All clients: The Source ask route now enforces the active client boundary before selecting Apex-specific context.
- Specific clients: Lakeshore Holdings benefits directly because Apex Source event ids cannot select Apex context while Lakeshore is active.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts`: Requires Apex adapter use to match the known active client boundary, and returns not-found for unresolved event-scoped requests.
- `src/__tests__/integration/source/source-nexus-route-tenant-scope.test.ts`: Adds regression coverage for non-Apex active clients, Apex adapter selection, and unresolved-event fallback behavior.

## QA / Validation

- `npx jest src/__tests__/integration/source/source-nexus-route-tenant-scope.test.ts --runInBand` — passed.
- `npx jest src/__tests__/integration/source/source-nexus-route-tenant-scope.test.ts src/__tests__/integration/source/source-nexus-api-stub.test.ts src/lib/source/__tests__/nexus-api-live-context.test.ts --runInBand` — passed.
- `npm run test:behaviors` — passed.
- `npm run test:nav` — passed.
- `npx tsc --noEmit --pretty false` — passed.
- `npm run release:check` — passed.

## Rollout Plan

Merge to `main`; Vercel deploy picks up the route guard with no manual runtime steps.

## Rollback Plan

Revert the PR. No data or migration rollback is required.

## Audit Evidence

- Release record: `docs/releases/records/2026-06-04-source-nexus-tenant-scope-qa.md`
- Focused Jest, behavior/nav, TypeScript, and release gate output listed in QA / Validation.

## Known Gaps

This slice does not implement a full live LLM Source answer engine or address all remaining Source audit backlog items. It specifically closes the tenant-context routing risk that could make a Source answer use Apex context outside an Apex active-client boundary.
