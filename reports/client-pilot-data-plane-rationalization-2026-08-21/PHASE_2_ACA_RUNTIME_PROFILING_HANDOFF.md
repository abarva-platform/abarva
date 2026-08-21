# Phase 2 ACA Runtime Profiling Handoff

Status: ready to run after merge/deploy of the read-only profiler entrypoint.

## Why This Was Not Run Locally

The local workstation cannot resolve the Azure Postgres private DNS host:

`getaddrinfo ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com`

Do not open public database access to work around this. The runtime sweep must run through the private ACA operator job inside the VNet.

## Required Merge Boundary

Merge only:

- Phase 1 static sweep artifacts.
- The read-only runtime profiler script.
- The npm script entrypoint.
- The read-only release record.

Do not merge broad tenant refreshes, Home snapshot promotion, canonical backfills, data loads, projection refreshes, or consumer repoints as part of this step.

## Profiler Entrypoint

NPM script:

```bash
npm run audit:client-pilot-runtime-profile
```

Script:

```bash
node scripts/audit/client-pilot-runtime-profile.mjs
```

Local validation already performed:

```bash
npm run audit:client-pilot-runtime-profile -- --help
npm run audit:client-pilot-runtime-profile -- --self-test --out-dir /tmp/client-pilot-runtime-profile-self-test-20260821T025707Z
```

## Required Read-Only Secret

The job intentionally refuses ordinary write-capable database URL names. Provide one of:

- `READONLY_DATABASE_URL`
- `READ_ONLY_DATABASE_URL`
- `ABARVA_READONLY_DATABASE_URL`

The database role must have no `INSERT`, `UPDATE`, `DELETE`, or `TRUNCATE` privileges on non-system tables/views/materialized views. The script opens a read-only transaction and writes `ROLE_WRITE_PRIVILEGE_VIOLATIONS.csv`; if any violation exists, it fails before authority conclusions are produced.

## Operator Job Command Shape

After merge to `main`, repo-owned ACA deploy, and digest capture:

```bash
npm run ops:aca-job -- \
  --image acrabarvalab001.azurecr.io/abarva/web@sha256:<merged-main-digest> \
  --script audit:client-pilot-runtime-profile \
  --secret-env READONLY_DATABASE_URL=<read-only-db-secret-name> \
  --env RUNTIME_PROFILE_TENANT_SCOPE=all-active-registry-tenants \
  --env RUNTIME_PROFILE_RUN_ID=client-pilot-runtime-profile-20260821T000000Z \
  --env RUNTIME_PROFILE_EMIT_PROOF_BUNDLE=true \
  --out-dir /tmp/client-pilot-runtime-profile-20260821T000000Z
```

Use a real UTC timestamp for `RUNTIME_PROFILE_RUN_ID`.

## Required Outputs

The job must emit:

1. `LIVE_DATABASE_OBJECT_PROFILE.csv`
2. `LIVE_WRITER_READER_MATRIX.csv`
3. `STATIC_VS_LIVE_DELTA.csv`
4. `ACTIVE_WRITE_PATHS.csv`
5. `ACTIVE_READ_AND_FALLBACK_PATHS.csv`
6. `DUPLICATE_TRUTH_AND_DUAL_WRITE_REPORT.md`
7. `TENANT_ISOLATION_AND_RLS_REPORT.md`
8. `NON_DATABASE_STORE_INVENTORY.csv`
9. `FINAL_TRUTH_AUTHORITY_MATRIX.csv`
10. `TARGET_CLIENT_PILOT_DATA_ARCHITECTURE.md`
11. `PILOT_MIGRATION_WAVES.csv`
12. `CONSUMER_PARITY_TEST_PLAN.csv`
13. `LEGACY_SUNSET_REGISTER.csv`
14. `CUTOVER_AND_ROLLBACK_RUNBOOK.md`

The operator wrapper should also capture request metadata, execution logs, proof extraction, and idle-restore evidence.

## Still Not Authorized After Job Start

Even a successful runtime profile does not authorize migration by itself. The outputs must be reconciled with Phase 1 static discovery and reviewed for:

- Every active object owner/disposition.
- Every active writer and reader/fallback.
- One approved authority per business-object family.
- Projection rebuild procedures.
- Legacy replacement and rollback.
- Tenant isolation proof.
- No generated artifact treated as canonical truth.
- No unresolved dual-write.
- Approved private-data-plane pilot scope.

