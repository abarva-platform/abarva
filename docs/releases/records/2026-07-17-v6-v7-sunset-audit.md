# 2026-07-17-v6-v7-sunset-audit — V6/V7 Sunset Deletion Readiness Audit

## Release ID

`2026-07-17-v6-v7-sunset-audit`

## Status

`candidate`

## Plain-English Summary

This change adds a reproducible Phase 0 audit for retiring V6/V7 runtime and dataset structures. It does not delete runtime code, data, schemas, migrations, generated artifacts, or proof files. It maps current V6/V7 references, classifies them by dependency type, and names what V3 replacement must be proven before deletion can proceed.

The audit outcome is intentionally conservative: V6/V7 is not ready for broad deletion because Home, Tower, Intelligence, loaders, generated artifacts, tests, and historical migrations still contain V6/V7 references. Meridian is the current V3 physical dataset; SkyHarbor Air and First Capital remain WIP/planned for the new V3 physical dataset.

## Layer Impact

- `global-control-lane`: Adds audit tooling and release evidence only. No runtime behavior changes.
- `client-data-lane`: Produces a tenant/data dependency map, but performs no tenant data load, deletion, migration, or promotion.
- `internal-admin`: Gives operators a deletion-readiness report for sequencing future cleanup.

## Client Applicability

- All clients: Audit visibility only; no product behavior changes.
- Specific clients: Meridian, SkyHarbor Air, and First Capital are referenced in the report where current V3/V6/V7 context artifacts exist.
- Internal only: Yes, this is an internal control-plane audit.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `scripts/audit/v6-v7-sunset-deletion-readiness.mjs`.
- Adds `npm run audit:v6-v7-sunset`.
- Generates `reports/v6-v7-sunset/dependency-map.md`.
- Generates `reports/v6-v7-sunset/dependency-map.json`.
- Generates `reports/v6-v7-sunset/safe-delete-candidates.csv`.
- Generates `reports/v6-v7-sunset/blocked-delete-candidates.csv`.
- Generates `reports/v6-v7-sunset/runtime-dependencies.csv`.
- Generates `reports/v6-v7-sunset/replacement-required.csv`.
- Generates `reports/v6-v7-sunset/proof.html` as an operator-readable summary.

## QA / Validation

- Pass: `npm run audit:v6-v7-sunset`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:legacy-context-retirement`
- Pass: `npm run audit:v3-only-active-architecture`
- Pass: `npm run audit:no-legacy-context-language`
- Pass: `npm run audit:legacy-dataset-sunset`
- Pass: `NODE_PATH=/Users/anand/Projects/nexus/node_modules npm run validate:context-corpus:manifests`

## Rollout Plan

Merge the audit/control PR only. There is no runtime rollout, no Azure Container Apps deployment, no data-plane mutation, no schema migration, and no tenant promotion.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable; no deployment.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No, because this PR is audit/report only and does not change runtime behavior.

## Rollback Plan

Revert the audit PR to remove the report generator, npm script, release record, and generated reports. No data rollback is needed because no database, runtime, tenant data, or schema state is mutated.

## Audit Evidence

- `reports/v6-v7-sunset/dependency-map.md`
- `reports/v6-v7-sunset/dependency-map.json`
- `reports/v6-v7-sunset/runtime-dependencies.csv`
- `reports/v6-v7-sunset/blocked-delete-candidates.csv`
- `reports/v6-v7-sunset/safe-delete-candidates.csv`
- `reports/v6-v7-sunset/replacement-required.csv`

## Known Gaps

This is not approval to delete V6/V7. Runtime cleanup waits for V3 replacements that are implemented, merged, deployed through the approved ACA main workflow when runtime-visible, signed-in browser-proven, tenant-safe, and same-or-better. Forward schema retirement requires explicit Anand approval and forward-only migrations; historical migrations must remain immutable.
