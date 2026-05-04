# G-05 — Service-role DAL scoping audit (parallel PR)

**Goal:** Verify every server path that uses `getServerSupabase()` / service role enforces **active `client_id`** (or equivalent tenant key) before reading or writing program-scoped tables, since RLS is bypassed (`supabase/migrations/052_program_access_control.sql`, `src/lib/programs/programs-auth-mode-server.ts`).

## Scope

- `src/lib/programs/**/*.ts` — all `.from(` calls: confirm `.eq('client_id', …)` or join through `engagements` filtered by `client_id` / `allowedProgramIdsForUser`.
- `src/app/api/v1/programs/**/*.ts` — route handlers use `getProgramsRouteSupabase` + `getProgramById` / tenancy checks.
- Document exceptions (e.g. admin-only routes) with threat model note.

## Deliverables

1. Grep or scripted inventory of Supabase queries missing tenant filters.
2. Jest or CI check that fails on new unscoped `.from('engagements')` patterns (optional).
3. Short sign-off section in this file when complete.

**Do not merge** with the Strategic Moves visual + bugfix PR; land as a separate branch/PR.
