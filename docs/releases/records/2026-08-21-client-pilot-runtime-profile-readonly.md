# 2026-08-21-client-pilot-runtime-profile-readonly — Read-Only Runtime Profiling Job

## Release ID

`2026-08-21-client-pilot-runtime-profile-readonly`

## Status

`candidate`

## Plain-English Summary

Adds a read-only operator job entrypoint for the runtime half of the client-pilot data-plane rationalization sweep. The command profiles live database objects, runtime reader/writer evidence, tenant isolation posture, non-database stores, and migration-readiness matrices without applying schema changes or writing tenant data.

## Layer Impact

- Audit/lineage: Adds a runtime evidence collector and proof bundle contract.
- Control/config: Requires a read-only database secret for the operator job.
- Products and data plane: No product behavior, schema, data, snapshot, or projection changes are included.

## Client Applicability

- All clients: No direct runtime change.
- Specific clients: None.
- Internal only: Yes, operator/audit tooling only.
- Public/demo only: No.
- Feature flag: Not applicable.

## Changes Included

- `scripts/audit/client-pilot-runtime-profile.mjs`
- `package.json` script `audit:client-pilot-runtime-profile`
- Static Phase 1 sweep artifacts under `reports/client-pilot-data-plane-rationalization-2026-08-21/`
- Static data-flow artifacts under `reports/enterprise-data-flow-map-2026-08-21/`

## QA / Validation

- `npm run audit:client-pilot-runtime-profile -- --help` prints usage.
- `npm run audit:client-pilot-runtime-profile -- --self-test --out-dir /tmp/client-pilot-runtime-profile-self-test` passes local report-writer self-test.
- Existing JSON sweep artifacts parse successfully.

## Rollout Plan

Merge only the read-only audit artifacts and profiler tooling through PR. After the repo-owned Azure Container Apps main deploy workflow builds a digest-pinned image from the merged SHA, run the profiler through the existing private ACA operator job with a read-only database secret.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` for image creation when needed.
- Shared runtime mutators: Do not mutate web traffic, web template, or production feature flags.
- Approved image digest: Required before operator job execution.
- ACA runtime invariant: Required before using the deployed image for proof.
- Worker image invariant: Not applicable unless the operator job image is updated by deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Separate consumer parity phase; not part of this read-only database profiler.

## Rollback Plan

Revert the profiler script, npm script, release record, and generated audit artifacts. No data rollback is required because the command is read-only and refuses to proceed when connected with a role that has write privileges.

## Audit Evidence

- Local self-test output.
- Operator job request metadata, execution logs, proof bundle, and idle-restore evidence after VNet run.
- Runtime output files listed in the sweep README.

## Known Gaps

- The profiler cannot run locally from this workstation because the Azure Postgres host is private-DNS/VNet scoped.
- Runtime authority conclusions remain blocked until the VNet-connected ACA job runs with a read-only database identity.
