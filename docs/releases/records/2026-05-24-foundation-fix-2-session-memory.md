# 2026-05-24-foundation-fix-2-session-memory — Intelligence Ask Session Memory

## Release ID

`2026-05-24-foundation-fix-2-session-memory`

## Status

`candidate`

## Plain-English Summary

Intelligence Ask now has tenant/user/tab scoped session memory. Follow-up questions can use the prior conversation, and Moves created from an Intelligence Ask handoff keep a database link back to the originating session so Move-detail chat can resolve "this Move" and pre-mortem questions against the original rationale.

## Layer Impact

`global-control-lane`: Adds a shared API/session-memory behavior and Move-detail prompt context.

`client-data-lane`: Adds Supabase tables, RLS, and nullable linkage columns for tenant-scoped session and Move continuity.

## Client Applicability

All clients: applies to authenticated tenants using `/intelligence/ask`, `/programs/new`, and Strategic Move detail pages.

Specific clients: none.

Internal only: no.

Public/demo only: no.

Feature flag: none.

## Changes Included

- Migration: `supabase/migrations/20260524184500_intelligence_ask_session_memory.sql`
- API/session helper: `src/lib/intelligence/ask/session-memory.ts`
- Routes/components: `/api/intelligence/ask`, `/intelligence/ask`, `/programs/new`, Move detail chat, and `/api/chat/agent`
- Smoke: `scripts/smoke/foundation-fix-2-session-memory.spec.ts`

## QA / Validation

- `npm run smoke:foundation-fix-2-session-memory` — passed.
- Focused `npx eslint` across the changed route/helper/client/template files — passed with no warnings after dependency install.
- `npm run build` — passed on Next.js 16.2.2 / Turbopack. Build emitted existing `--localstorage-file` warnings during page-data collection but completed successfully.

## Rollout Plan

Merge to main, apply the Supabase migration, then deploy the app. The behavior activates automatically once the migration is present.

## Rollback Plan

Revert the app changes to stop writing/reading session memory. The new tables and nullable columns are additive and can remain dormant; dropping them should be a separate migration only after confirming no Move links are needed.

## Audit Evidence

Inspect the migration, smoke output, release record, and diff for the ask route, session helper, origination submit path, and Move-detail chat route context.

## Known Gaps

No live Supabase migration replay in this worker slice unless validation credentials are available.
