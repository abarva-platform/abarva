# Tenant Connection Resolution Evidence Packet

Date: 2026-06-03

Backlog: T030 — tenant-scoped connection-string resolution.

## What Changed

The data-plane connection resolver now has a deterministic client-scoped path:
when a runtime client key or client id is present, the resolver looks only for
that client's projected database URL secret and refuses shared fallback unless a
preview-only env flag explicitly enables it.

## Runtime Contract

- Client scope comes from `ABARVA_ACTIVE_CLIENT_KEY`, `ABARVA_CLIENT_KEY`,
  `ABARVA_ACTIVE_CLIENT_ID`, or `ABARVA_CLIENT_ID`.
- Client database URL secrets use
  `ABARVA_CLIENT_DATABASE_URL_<CLIENT_TOKEN>` as the canonical name.
- Compatibility names `ABARVA_TENANT_DATABASE_URL_<CLIENT_TOKEN>` and
  `AZURE_CLIENT_DATABASE_URL_<CLIENT_TOKEN>` are accepted.
- If tenant scope exists but no matching secret exists, no candidate connection
  string is returned.
- Shared `ABARVA_AZURE_DATABASE_URL` / `DATABASE_URL` fallback remains available
  only when no tenant scope is present, or when
  `ABARVA_ALLOW_SHARED_DATABASE_URL_FALLBACK=true` is explicitly set.

## Files

- `src/lib/data-plane/tenantConnectionResolver.ts`
- `src/lib/data-plane/postgresCompat.ts`
- `src/lib/data-plane/read-adapters/azureSession.ts`
- `src/lib/data-plane/read-adapters/azurePostgresReadAdapter.ts`
- `src/lib/supabase-server.ts`
- `src/lib/__tests__/supabase-server.test.ts`
- `scripts/data-plane/verify-tenant-connection-resolution.mjs`
- `docs/runbooks/tenant-connection-resolution.md`

## Local QA

- `npx jest src/lib/__tests__/supabase-server.test.ts --runInBand` — passed.
- `npm run data-plane:tenant-connection:verify` — passed.
- `npx eslint src/lib/data-plane/tenantConnectionResolver.ts src/lib/data-plane/postgresCompat.ts src/lib/data-plane/read-adapters/azureSession.ts src/lib/supabase-server.ts src/lib/__tests__/supabase-server.test.ts` — passed.
- `npm run release:check -- --base origin/main --head HEAD` — passed,
  including the Pilot Data Loader Gate.
- `npx tsc --noEmit --pretty false` — local run blocked by the existing shared
  `node_modules` missing `@axe-core/playwright` for
  `tests/accessibility/public-axe.spec.ts`; no T030 TypeScript error surfaced
  before that dependency-resolution failure.

## What This Does Not Prove Yet

- No Azure Key Vault secret was created by this slice.
- No live private client Postgres endpoint was contacted by this slice.
- Request-local tenant scope still needs to be threaded into every route that
  must support simultaneous multi-client runtime operation.
- Production/pilot promotion still requires Azure secret projection, Clerk SSO
  org mapping, DB smoke evidence, and negative fail-closed evidence.
