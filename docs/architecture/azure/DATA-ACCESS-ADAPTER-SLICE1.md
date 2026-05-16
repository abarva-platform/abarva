# Data-Access Adapter — Slice 1

Date: 2026-05-15
Lane: Claude Code (Azure data-access adapter)
Status: shipped

## Why this exists

AbarVa is moving toward an Azure parallel-run cutover. Today most app/API
read paths call Supabase directly. That direct coupling is the biggest
remaining blocker to a credible parallel run: you cannot run production
and an Azure-backed instance side by side if every route hard-codes a
Supabase client.

This slice introduces a **data-plane read-adapter seam** so the backing
store becomes an implementation detail. It does not migrate the whole app
— it migrates one cutover-critical, read-only path end to end and
establishes the boundary the rest can follow.

## Direct Supabase coupling — inventory

Counted via `rg -l "getServerSupabase|createServerClient|createClient\("`.

| Class | Count | Migration priority |
|---|---:|---|
| API routes (runtime reads/writes) | 40 | High — these gate parallel run. |
| Server components / pages | 10 | Medium — read models behind product surfaces. |
| `src/lib` modules | 122 | Mixed — many are query helpers reused by the above; migrate transitively. |
| Operator / seed scripts | 68 | Low — acceptable short term; not a cutover blocker. |

The 122 `src/lib` hits are not 122 independent problems — most are query
helpers (`*/queries.ts`, `*/repository.ts`) called by the routes and
pages above. Migrating a route typically pulls its helper with it. The
adapter seam introduced here is the pattern those follow.

## What slice 1 ships

The first migrated path is **`GET /api/admin/parallel-run-invariants`**.

Why this path first:
- It is the endpoint the parallel-run diff harness (`scripts/parallel-run-diff.ts`)
  calls to compare prod vs Azure — migrating it directly advances the
  cutover proof.
- It is strictly read-only — zero write risk.
- It is founder-visible as a cutover gate.

### The adapter seam

```
src/lib/data-plane/read-adapters/
  types.ts                    — TenantInvariants, ParallelRunReadAdapter contract
  supabaseReadAdapter.ts      — DEFAULT; query logic lifted verbatim from the route
  azurePostgresReadAdapter.ts — Azure lab path, direct `pg`
  index.ts                    — selectReadAdapter() + buildInvariantPayload()
```

The route no longer talks to Supabase. It calls `selectReadAdapter()`,
which picks a concrete adapter from the `ABARVA_DATA_PLANE` env var:

| `ABARVA_DATA_PLANE` | Adapter | Notes |
|---|---|---|
| unset / anything unrecognized | `supabaseReadAdapter` | **Default — production behavior unchanged.** |
| `supabase` | `supabaseReadAdapter` | Explicit. |
| `azure-postgres` | `azurePostgresReadAdapter` | Azure lab path. |

### Azure adapter connection resolution

The Azure adapter reads its connection string from, in order:

1. `ABARVA_AZURE_DATABASE_URL` — explicit override (handy for a local dry
   run while `DATABASE_URL` still points at production).
2. `DATABASE_URL` — the deployed Azure container projects its Azure
   Postgres connection string here.

### Guarantees the contract enforces

- **Tenant keys are canonicalized on the way in.** Both adapters run
  `canonicalTenantKey` so `apexretail -> apex-retail`,
  `meridian -> meridian-health`, `arcturus -> first-capital`. A query is
  never split between an alias and its canonical key.
- **Missing optional data returns zeros, never a 500.** Every count/list
  query is wrapped — a missing table or absent client row yields `0` / `[]`.
- **Read-only.** Neither adapter writes. The Azure adapter additionally
  restricts itself to an allowlist of nine tables (table names are
  interpolated into SQL and cannot be parameterized).
- **Route response shape is unchanged.** `TenantInvariants` and
  `ParallelRunInvariantPayload` are defined once in `types.ts`; the route
  re-exports them. The parallel-run diff harness depends on this shape
  field-for-field and is unaffected.

## Validation

```
npx tsc --noEmit -p tsconfig.json           # clean
npx eslint src/lib/data-plane/ <route>      # clean
npx jest src/lib/data-plane                 # 14/14 pass
```

The 14 unit tests pin: default plane = supabase; explicit/env selection
of azure-postgres; tenant-key canonicalization on both adapters; the
payload shape + summed totals; and zeros-not-500 on a failed table query.

A live Azure dry run is operator-gated — it needs a real
`ABARVA_AZURE_DATABASE_URL`:

```
ABARVA_DATA_PLANE=azure-postgres \
ABARVA_AZURE_DATABASE_URL=<azure-postgres-url> \
npm run parallel-run:diff -- --left-base-url ... --right-base-url ... --invariant-token ...
```

## What remains after this slice

- The other 39 Supabase-coupled API routes — migrate behind the same
  seam, highest-traffic first (Home / Intelligence / Tower read models).
- A write-adapter contract (this slice is read-only by design).
- The `src/lib` query helpers — migrate transitively as their callers move.
- Operator scripts can keep direct Supabase access until last.

## Definition of done — met

- The parallel-run invariants route no longer owns direct Supabase query
  logic. ✅
- A data-adapter boundary exists (`src/lib/data-plane/read-adapters`). ✅
- Default behavior is unchanged (`supabase` is the implicit default). ✅
- Azure Postgres can be selected explicitly (`ABARVA_DATA_PLANE`). ✅
- Tests pin adapter selection and tenant-key normalization. ✅
