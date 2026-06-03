# 2026-06-03-tenant-connection-resolution — Tenant Connection Resolution

## Release ID

`2026-06-03-tenant-connection-resolution`

## Status

`candidate`

## Plain-English Summary

Adds a server-side resolver for client-scoped data-plane database URLs. If the
runtime knows the active client, it will use only that client's projected secret
and will not quietly query a shared database. This is a pilot-readiness safety
step for one-client-only private data-plane operation.

## Layer Impact

- `client-data-lane`: Data-plane connection resolution now has an explicit
  tenant-scoped path and fail-closed behavior when a scoped client secret is
  missing.
- `internal-admin`: Adds an operator runbook and deterministic verifier for the
  client secret projection contract.

## Client Applicability

- All clients: The resolver contract applies to any client once their scoped
  database URL secret is projected into runtime.
- Specific clients: None.
- Internal only: Runbook and verifier are for AbarVa operators.
- Public/demo only: None.
- Feature flag: Shared fallback requires explicit
  `ABARVA_ALLOW_SHARED_DATABASE_URL_FALLBACK=true`.

## Changes Included

- New tenant connection resolver at
  `src/lib/data-plane/tenantConnectionResolver.ts`.
- Existing Postgres compatibility and Azure read session candidate resolution
  now call the scoped resolver.
- The older Azure Postgres read adapter now resolves through the same scoped
  resolver instead of carrying its own shared-only fallback.
- `src/lib/supabase-server.ts` re-exports the resolver helpers for tests and
  future server-side routes.
- Focused Jest coverage added to prove tenant-scoped secret selection, shared
  fallback denial, explicit preview fallback, deterministic env-name
  normalization, and credential masking.
- Operator runbook and evidence packet added.

## QA / Validation

- `npx jest src/lib/__tests__/supabase-server.test.ts --runInBand` — passed.
- `npm run data-plane:tenant-connection:verify` — passed.
- `npx eslint src/lib/data-plane/tenantConnectionResolver.ts src/lib/data-plane/postgresCompat.ts src/lib/data-plane/read-adapters/azureSession.ts src/lib/supabase-server.ts src/lib/__tests__/supabase-server.test.ts` — passed.
- `npm run release:check -- --base origin/main --head HEAD` — passed,
  including the Pilot Data Loader Gate.
- `npx tsc --noEmit --pretty false` — local run blocked by the existing shared
  `node_modules` missing `@axe-core/playwright`; CI typecheck must be used as
  the current full-repo signal.

## Rollout Plan

Merge to main. Existing unscoped runtime behavior remains compatible with
`ABARVA_AZURE_DATABASE_URL` / `DATABASE_URL`. Tenant-scoped behavior activates
only when runtime client-scope env vars are present and the matching client
database secret has been projected.

## Rollback Plan

Revert the PR. The legacy global candidate order
`ABARVA_AZURE_DATABASE_URL` then `DATABASE_URL` will be restored.

## Audit Evidence

- PR URL: pending.
- CI checks: pending.
- Local Jest and release-check output from this PR run.
- `docs/build/TENANT_CONNECTION_RESOLUTION_2026-06-03.md`.
- `docs/runbooks/tenant-connection-resolution.md`.

## Known Gaps

- No live Azure Key Vault secret projection was performed.
- No live private client database smoke was performed.
- Request-local tenant scope still needs a follow-on slice before simultaneous
  multi-client runtime operation is certified.
