# 2026-06-07-supabase-retirement-readiness - Supabase Retirement Readiness

## Release ID

`2026-06-07-supabase-retirement-readiness`

## Status

`candidate`

## Plain-English Summary

Adds the controlled Supabase retirement readiness report requested for
AbarVa/Nexus. The report confirms the current Azure Container Apps runtime is
Azure/Postgres-backed and has no Supabase env or secret names projected, but it
does not approve Supabase shutdown. Fresh data reconciliation is blocked by
source database secret access and missing source-backed operator job projection;
several required client evidence, Source, Move, artifact, QA, backup, and
restore gates remain incomplete.

## Layer Impact

- `global-control-lane`: Records current Azure runtime dependency proof for the
  shared production control-plane runtime.
- `client-data-lane`: Records blocked source-vs-Azure data proof for client
  context, corpus, Source, Move, and evidence data.
- `internal-admin`: Adds operator-facing readiness, missing-data, backup, and
  shutdown-decision documentation.

## Client Applicability

- All clients: Yes. Supabase retirement affects shared and tenant-scoped
  runtime data safety for every client.
- Specific clients: Lakeshore and Meridian are explicitly named for required
  signed-in QA and retrieval proof; historical Search evidence also covers
  Apex, First Capital, Northstar, and SkyHarbor.
- Internal only: Yes. This is an operator/auditor readiness artifact.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `docs/build/legacy-shutdown-readiness/README.md`.
- Adds `docs/build/legacy-shutdown-readiness/runtime-dependency-proof.md`.
- Adds `docs/build/legacy-shutdown-readiness/supabase-azure-reconcile.json`.
- Adds `docs/build/legacy-shutdown-readiness/supabase-azure-reconcile.csv`.
- Adds `docs/build/legacy-shutdown-readiness/missing-data-register.csv`.
- Adds `docs/build/legacy-shutdown-readiness/supabase-final-backup-proof.md`.
- Updates `docs/planning/ABARVA_PILOT_READINESS_PLAN.xlsx` with a
  `Legacy Shutdown` tab and a `Supabase` row marked `BLOCKED`.

## QA / Validation

Performed in this run:

- Fresh Azure Resource Manager metadata read for
  `ca-abarva-web-lab-eastus`: active revision `0000052`, 100 percent traffic,
  image `acrabarvalab001.azurecr.io/abarva/web:cutover-main-20260607-70c4f98bf`,
  `ABARVA_DATA_PLANE=azure-postgres`, `DATABASE_URL` secret ref
  `azure-postgres-control-database-url`, zero Supabase env names, zero
  Supabase secret names.
- Fresh live health checks:
  - Azure FQDN `/api/health`: HTTP 200, `postgres=true`,
    `direct_postgres=true`, `azure_graph=postgres`.
  - `app.abarva.ai/api/health`: HTTP 200, `postgres=true`,
    `direct_postgres=true`, `azure_graph=postgres`.
- Fresh direct DB reconciliation attempt using Key Vault secret names only and
  no secret printing: blocked by HTTP 403 reading
  `source-postgres-database-url`.
- Fresh Container Apps job metadata read: current `job-supa-drain-ro-eus` and
  `job-supa-drain-sum-eus` do not project `SOURCE_DATABASE_URL`; historical
  `job-supa-recon-eus`, `job-supa-final-eus`, and `job-a24-azure-soak-eus`
  were not present in the current job list.

Validation commands for this branch are recorded in the final PR/agent summary.

## Rollout Plan

Merge the documentation-only proof pack to `main`. No runtime rollout, data
migration, Azure Search rebuild, Supabase mutation, DNS change, or Vercel change
is performed by this release record.

## Rollback Plan

Revert the documentation commit if the readiness pack needs to be withdrawn or
replaced. No production resources are changed by these docs, so rollback is a
git-only documentation rollback.

## Audit Evidence

- `docs/build/legacy-shutdown-readiness/README.md`
- `docs/build/legacy-shutdown-readiness/runtime-dependency-proof.md`
- `docs/build/legacy-shutdown-readiness/supabase-azure-reconcile.json`
- `docs/build/legacy-shutdown-readiness/supabase-azure-reconcile.csv`
- `docs/build/legacy-shutdown-readiness/missing-data-register.csv`
- `docs/build/legacy-shutdown-readiness/supabase-final-backup-proof.md`
- Historical references:
  - `docs/build/supabase-sunset-proof-2026-06-07/README.md`
  - `docs/build/supabase-sunset-proof-2026-06-07/02-final-backup.md`
  - `docs/build/supabase-sunset-proof-2026-06-07/03-azure-parity.csv`
  - `docs/build/supabase-sunset-proof-2026-06-07/04-search-vector-proof.md`
  - `docs/build/azure-container-apps-cutover-2026-06-07/FINAL_SIGNED_IN_PROD_QA.md`

## Known Gaps

- Supabase retirement remains blocked.
- Fresh source-vs-Azure reconciliation could not run because source DB secret
  access returned HTTP 403 in this environment.
- Required table families for applications, persons, memberships, engagements,
  Source, Move, and artifacts still need count/PK/checksum proof or documented
  supersession.
- Azure Search golden retrieval proof for Lakeshore and Meridian was not
  captured in this run.
- Signed-in QA with the requested Lakeshore and Meridian personas was not run in
  this run.
- Row-level `ai_egress_audit.provider=anthropic` proof is not attached.
- Final native dump/restore-test and Supabase storage export/inventory remain
  incomplete.
- Anand has not approved deletion after a green report; this report is not
  green.
