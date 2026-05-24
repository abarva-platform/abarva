# 2026-05-24-source-event-code-prefix-fix — Source Event Code Tenant Alias Fix

## Release ID

`2026-05-24-source-event-code-prefix-fix`

## Status

`candidate`

## Plain-English Summary

This release fixes Source event code generation so tenant names at the beginning of an event name are not repeated after the tenant prefix. The authenticated Apex/Meridian crawl found that creating "Apex Wipro AMS Renegotiation..." produced `APEX-APEX-WIPRO-AMS-2026`; future event codes now strip both full tenant names and short aliases before building the slug.

## Layer Impact

- `source-control-lane`: Hardens Source event identity generation for newly created procurement events.
- `app-control-lane`: No UI workflow change. The existing create-event route now receives cleaner generated event codes from the shared Source query layer.

## Client Applicability

- All clients: Applies to future Source events for every tenant.
- Specific clients: The defect was observed on Apex and the regression test also covers Meridian.
- Internal only: None.
- Public/demo only: None.
- Feature flag: Not applicable.

## Changes Included

- `src/lib/source/queries.ts` strips full tenant names and first-token aliases before event-code slugging.
- `src/lib/source/__tests__/create-sourcing-event-scaffold.test.ts` adds Meridian short-alias regression coverage and keeps Apex duplicate-prefix coverage.
- PR #2333 records the fix after the authenticated two-tenant audit run.

## QA / Validation

- pass: `npm test -- --runTestsByPath src/lib/source/__tests__/create-sourcing-event-scaffold.test.ts`
- pass: `npx eslint src/lib/source/queries.ts src/lib/source/__tests__/create-sourcing-event-scaffold.test.ts`
- crawl evidence: Apex event `d2001b83-d636-4b5a-a3d4-be3c876f8bbd` exposed the pre-fix duplicate code `APEX-APEX-WIPRO-AMS-2026`.
- crawl evidence: Meridian event `f805ea35-4ffa-4134-afc0-54c59f7fba27` passed the explicit `MERIDIAN-MERIDIAN` check, while the new regression prevents `MERI-MERIDIAN` style duplication too.

## Rollout Plan

Merge PR #2333 to `main`. Vercel production deployment follows the existing Git integration. No database migration is required for future event generation.

## Rollback Plan

Revert PR #2333. Rollback restores prior event-code generation behavior only; it does not alter existing Source event rows.

## Audit Evidence

- PR #2333: `https://github.com/anandsundaram-hash/abarva/pull/2333`
- Apex crawl report: `/Users/anand/Projects/nexus/audit-artifacts/apex-2task-eval-2026-05-24-17-39-opA/APEX_AGENT_INTELLIGENCE_REPORT.html`
- Meridian crawl report: `/Users/anand/Projects/nexus/audit-artifacts/meridian-2task-eval-2026-05-24-17-39-opB/MERIDIAN_AGENT_INTELLIGENCE_REPORT.html`
- Focused test and ESLint commands listed above.

## Known Gaps

Existing duplicate event codes are not rewritten by this runtime fix. Run the Packet 22 source-event-code backfill script for historical rows and record its audit output separately.
