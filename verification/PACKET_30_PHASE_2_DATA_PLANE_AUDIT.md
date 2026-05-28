# Packet 30 Phase 2 — Data Plane Burn-Down Audit

Date: 2026-05-28
Branch: `codex/arch-consolidation-phase-2-data-plane`
Base: `origin/main` at Packet 30 Phase 1 merge (`8b753f5b`)

## Finding

Packet 30 Phase 2 cannot be safely executed as a single broad "remove Supabase imports from `src/app` and `src/lib`" PR without first splitting the data-plane migration into smaller compatibility slices.

The first runtime scan found:

```text
rg -l "@supabase|supabase-server|createServerSupabase|createServiceRoleClient|createRouteHandlerClient|getServerSupabase" src/app src/lib --glob '!**/__tests__/**' | wc -l
183 files
```

A broader scan including query-builder usage found:

```text
rg -n "@supabase|supabase-js|supabase-server|createServerSupabase|createServiceRoleClient|createRouteHandlerClient|getServerSupabase|from\\(" src/app src/lib --glob '!**/__tests__/**' | wc -l
1526 matches
```

These are not isolated legacy references. They touch active runtime surfaces across:

- Intelligence and tenant context
- Programs / Moves
- Source
- Tower
- Evidence ledger
- Admin setup data
- Attachments and upload flows
- Agent trace / audit
- Auth and access policies
- Data-plane read/write adapters

## Why This Triggers Escalation

Packet 30 Phase 2 says:

- create one Azure read adapter
- delete/refactor every Supabase import under `src/app` and `src/lib`
- enforce zero Supabase imports in CI

That closure bar is valid as an end-state, but the current repo shape means the step is too large to land safely in one runtime PR. A direct conversion would either:

1. Create an unsafe Supabase-compatible query-builder shim over `pg`, which would silently preserve the wrong abstraction; or
2. Touch 183 runtime files in one change, making tenant isolation, writes, auth policy checks, uploads, and artifact generation hard to validate together; or
3. Add a CI guard before the app is ready, creating a permanently red branch.

Per Packet 30 R8 / Packet 31 time-boxing, this should pause for a phase amendment rather than pretending Phase 2 is a normal implementation slice.

## Proposed Amendment

Split Phase 2 into four mergeable subphases:

### Phase 2A — Azure Runtime Boundary

Goal: introduce the canonical runtime data-plane boundary without changing all callers.

Deliverables:

- `src/lib/data-plane/azureRead.ts`
- `src/lib/data-plane/azureWrite.ts`
- `src/lib/data-plane/runtimeDataPlane.ts`
- tests for session lifecycle, fallback behavior, typed row reads, and transaction writes
- migrate the new Packet 30 `resolveTenant.ts` off `getServerSupabase`
- add a reporting-only CI scan that prints Supabase runtime imports but does not fail

Acceptance:

- Phase 1 tenant resolver uses Azure session directly
- no behavior regression on `/api/intelligence/ask`
- import census artifact published

### Phase 2B — Critical Demo Path Migration

Goal: remove Supabase-facing imports from the highest-risk demo/runtime paths first.

Scope:

- `/api/intelligence/ask`
- tenant enterprise retrieval
- Source event read paths used in demo
- Tower portfolio read paths used in demo
- Program origination draft read/write path

Acceptance:

- SkyHarbor 3-question smoke still green
- Apex isolation smoke still green
- Source/Tower demo-path smoke green

### Phase 2C — Adapter-by-Adapter Migration

Goal: migrate remaining read/write adapters by ownership group.

Order:

1. `src/lib/data-plane/read-adapters/**`
2. `src/lib/data-plane/write-adapters/**`
3. Programs/Moves
4. Source
5. Tower/Admin
6. Evidence/attachments/uploads
7. Auth/access policy helpers

Acceptance:

- import census decreases monotonically
- each ownership group has focused tests and rollback notes

### Phase 2D — Enforcement

Goal: turn the guard from report-only to blocking.

Deliverables:

- ESLint/CI guard forbids new Supabase imports in `src/app` and `src/lib`
- allowlist only under `scripts/**` with `// @migration-utility-historical`
- release record names the final import count: `0`

Acceptance:

- zero Supabase imports in runtime
- CI guard active and green

## Recommendation

Proceed with Phase 2A next. Do not attempt all of Phase 2 in one PR.

This amendment preserves Packet 31's invariants:

- no silent broad runtime rewrite
- one source of truth as the destination
- tenant isolation remains explicitly testable
- each production deploy has a bounded rollback
