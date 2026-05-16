# Data-Access Adapter — Slice 2

Date: 2026-05-15
Lane: Claude Code (Azure data-access adapter)
Status: shipped

## Why this exists

Slice 1 introduced the data-plane read-adapter seam and migrated one
cutover-critical path (`GET /api/admin/parallel-run-invariants`). Slice 2
continues the migration across genuine tenant-scoped READ GET routes so
more of the runtime read surface can parallel-run against an Azure
Postgres backend with no product behavior change.

The seam is unchanged: `ABARVA_DATA_PLANE` selects `supabase` (default —
unchanged production behavior) vs `azure-postgres` (opt-in). Tenant keys
are canonicalized via `canonicalTenantKey` from `src/lib/tenant-keys.ts`.

## Design — per-domain adapters

Slice 1's `ParallelRunReadAdapter` is a single-method contract specific to
the invariants payload. Rather than bloat it, Slice 2 adds **per-domain
read adapters**, each with its own narrow contract, each with a `supabase`
+ `azure-postgres` implementation, each selected by the same
`resolveDataPlane()` switch:

| Domain | File | Contract method |
|---|---|---|
| Programs portfolio | `programsReadAdapter.ts` | `getProgramPortfolioRows({ clientId, allowedProgramIds, limit })` |
| Tower substrate | `towerSubstrateReadAdapter.ts` | `getSubstrateReport(tenants)` |
| Turn trace | `turnTraceReadAdapter.ts` | `getTurnTrace(turnId, clientId)` |

Shared `pg` connection plumbing (string resolution + session lifecycle)
was extracted from Slice 1's private `defaultSession` into
`azureSession.ts` so all Azure adapters share one source of truth.
`resolveDataPlane()` moved to its own module (`resolveDataPlane.ts`) so
per-domain adapters import the switch without pulling in the Slice 1
parallel-run adapters — keeps the import graph acyclic. `index.ts`
re-exports it, so existing importers are unaffected.

## Routes migrated

- **`GET /api/v1/programs`** — migrated via the `getProgramPortfolio`
  query helper in `src/lib/programs/queries.ts`, which now delegates its
  engagements-table read to `selectProgramsReadAdapter()`. RBAC scoping
  (`allowedProgramIdsForUser`) and the `rowToProgram` view-model transform
  stay in the query helper so access-policy logic is not duplicated across
  data planes. The route file itself is untouched; `POST` is untouched.
  When a caller passes its own `opts.supabase` client (server components),
  the Supabase adapter is used directly, preserving that contract.
- **`GET /api/debug/tower-substrate`** — the multi-strategy client
  resolution and all initiative count queries moved into
  `towerSubstrateReadAdapter`. The route is now a thin shell.
- **`GET /api/turn/[turnId]/trace`** — the tenant-scoped `turn_traces`
  read (join through `engagements.client_id`) moved into
  `turnTraceReadAdapter`. The tenancy join lives inside the adapter so the
  boundary is enforced identically on both planes; a missing or
  cross-tenant turn is reported as `not_found` indistinguishably.

## What was inspected and skipped

- **`GET /api/debug/vip`** — not a clean tenant-scoped read. It is
  entangled with Clerk identity (`currentUser`), `getCurrentPerson`, and
  `loadVipGreetingData`, with multiple `vip_profiles` lookups by
  person_id / exact name / fuzzy name plus prescription logic. Migrating
  it cleanly needs its own adapter contract for the VIP-profile lookup
  surface. **Follow-up (Slice 3 candidate).**

## Constraints honored

- No production data mutated; all queries read-only.
- No visible UI/product behavior change; route response shapes unchanged.
- Supabase remains the default; the Azure path is opt-in only.
- Codex-lane files untouched.

## Tests

`src/lib/data-plane/read-adapters/__tests__/` — three new suites
(`programs-`, `tower-substrate-`, `turn-trace-read-adapter.test.ts`):
default plane = supabase, azure selectable by env/argument, RBAC
allowlist short-circuit, response-shape stability, missing rows → zeros /
`not_found` rather than a thrown 500.
