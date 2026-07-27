# 2026-07-27-airline-zero-data-azure-plan — Airline Private Data Plane What-If

## Release ID

`2026-07-27-airline-zero-data-azure-plan`

## Status

`candidate - empty apply, zero-data, schema/RLS, and generic projections certified`

## Plain-English Summary

This release candidate creates the plan, live Azure what-if evidence, clean empty apply record, zero-data certification evidence, shared PostgreSQL schema/RLS evidence, and rollback-only generic projection conformance proof for the Airline Demo New private data plane. It proves the planned deployment is scoped to Airline infrastructure names, records the failed apply attempts, and applies the corrected clean `eastus2` plan. The first apply did not complete because PostgreSQL Flexible Server provisioning is restricted in `eastus` for the active subscription. The split-region retry was rejected because PostgreSQL cannot use a delegated subnet from a VNet in another region and ACA jobs needed explicit ACR pull grants. The clean `eastus2` data-plane resource group applied successfully and grants `AcrPull` before creating jobs. Shared schema/RLS and generic projection fixtures now pass in the empty private database. Source files, parser jobs, real Knowledge publication and product runtime wiring remain blocked until the Airline source audit passes and the source release is frozen.

## Layer Impact

- Release lane: `client-data-lane`.
- Client intake: no change.
- Source adapters: no source landing or parser execution.
- Canonical model: shared empty schema/RLS applied; no source-backed accepted Knowledge writes.
- Products: no Home, Source, Tower, Moves, Intelligence/aVa, Cube, or runtime wiring.
- Azure infrastructure: plan package plus failed apply evidence plus corrected live clean `eastus2` what-if, clean empty apply evidence, zero-data certification, private PostgreSQL schema/RLS evidence, and rollback-only generic projection fixture proof.

## Client Applicability

- All clients: none.
- Specific clients: Airline Demo New only.
- Internal only: operator execution evidence.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/main.bicep`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/airdn-lab-foundation.bicep`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/airdn-acr-pull.bicep`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/airdn-lab-jobs.bicep`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/airdn.lab.bicepparam`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/02-preapply-report/what-if-20260727.txt`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/02-preapply-report/what-if-eastus2-20260727.txt`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/02-preapply-report/what-if-clean-eastus2-20260727.txt`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/02-preapply-report/WHAT_IF_SAFETY_GATE.json`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/03-apply-record/APPLY_ATTEMPT_20260727.md`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/03-apply-record/APPLY_ATTEMPT_20260727.json`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/03-apply-record/APPLY_RETRY_SPLIT_REGION_20260727.md`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/03-apply-record/APPLY_CLEAN_EASTUS2_20260727.md`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/03-apply-record/APPLY_CLEAN_EASTUS2_20260727.json`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/04-zero-data-certification/ZERO_DATA_CERTIFICATION_20260727.json`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/04-zero-data-certification/ZERO_DATA_CERTIFICATION_CLEAN_EASTUS2_20260727.json`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/05-postgres-migration-rls/POSTGRES_MIGRATION_RLS_CONFORMANCE_20260727.json`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/05-postgres-migration-rls/generic-projection-conformance-fixture.sql`
- `clients/shared/21-phase3c2e-executable-data-layer/sql/002_shared_knowledge_publication_consumption_rls.sql`
- `scripts/knowledge/validate-airline-phase1-plan.mjs`
- `scripts/knowledge/validate-phase3c2e-executable-data-layer.mjs`

## QA / Validation

- Pass: `az bicep build --file clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/main.bicep`
- Pass: `az bicep build --file clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/airdn-lab-foundation.bicep`
- Pass: original live Azure what-if, create-only, 53 creates, 0 deletes, 0 modifies.
- Blocked: empty infrastructure apply attempted as `airdn-phase1-zero-data-apply-20260727`; PostgreSQL Flexible Server failed in `eastus` with subscription regional provisioning restriction; deployment was canceled after evidence capture.
- Failed/superseded: split-region apply retry proved PostgreSQL cannot use an `eastus` VNet from an `eastus2` server and ACA jobs need explicit `AcrPull`.
- Pass: clean `eastus2` live Azure what-if: 53 creates, 0 deletes, 0 modifies, 6 expected unsupported diagnostics for ACR role assignments whose principal IDs are known only after identity creation.
- Pass: clean empty infrastructure apply completed as `airdn-phase1-zero-data-apply-clean-eastus2-20260727`; provisioning state `Succeeded`; duration `PT7M8.8334589S`.
- Pass: zero-data certification for clean `eastus2` data plane: Postgres Ready with public network disabled, storage and Key Vault public network disabled/default deny, 13 ACA jobs with zero executions, no migrations, no source landing, no publication.
- Pass: shared PostgreSQL schema migration applied through private ACA job `job-airdn-validate-lab-jk1rhhw`; 10 shared schemas verified.
- Pass: RLS retry applied through private ACA job `job-airdn-validate-lab-90jjo74`; `rls_tables=47,missing=0`.
- Pass: rollback-only generic projection conformance fixture ran through private ACA job `job-airdn-validate-lab-xyws67t`; cross-tenant insert blocked; relationship endpoint/evidence validation returned 0 issues; traversal returned 1 neighbor; rollback left 0 fixture rows.
- Pass: `node scripts/knowledge/validate-airline-phase1-plan.mjs`
- Pass: `npm run test:phase3c2e-data-layer`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge as a plan, empty apply, zero-data, schema/RLS, and generic projection conformance package after review. Source landing, parser jobs, real Knowledge publication, Cube deployment, and runtime wiring remain blocked until the Airline source audit passes and the source release is frozen.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Approved image digest: `sha256:7eb0ec9024dfcc57b42b02e3a7fd3f82ff376fb024ee1d057eabad7b05ef9160`
- ACA runtime invariant: not applicable; no shared runtime deploy.
- Worker image invariant: future successful apply must use the pinned digest in the plan.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this plan-only PR.

## Rollback Plan

The first apply attempt created partial zero-data resources in `rg-abarva-airdn-lab-eus-001` and was canceled. The split-region retry was rejected and is superseded. The clean plan applied to the `eastus2` resource group, `rg-abarva-airdn-lab-eus2-001`. No source data rollback is required because no source files, parser jobs, source-backed publication jobs, Cube deploys, or product runtime wiring were run. The generic projection fixture was rollback-only and left zero fixture rows.

## Audit Evidence

- Raw live what-if output: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/02-preapply-report/what-if-20260727.txt`
- Revised retry what-if output: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/02-preapply-report/what-if-eastus2-20260727.txt`
- Clean `eastus2` what-if output: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/02-preapply-report/what-if-clean-eastus2-20260727.txt`
- Machine-readable safety gate: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/02-preapply-report/WHAT_IF_SAFETY_GATE.json`
- Pre-apply report: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/02-preapply-report/PRE_APPLY_REPORT.json`
- Apply attempt record: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/03-apply-record/APPLY_ATTEMPT_20260727.md`
- Apply attempt JSON: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/03-apply-record/APPLY_ATTEMPT_20260727.json`
- Split-region retry failure record: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/03-apply-record/APPLY_RETRY_SPLIT_REGION_20260727.md`
- Clean empty apply record: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/03-apply-record/APPLY_CLEAN_EASTUS2_20260727.md`
- Clean empty apply JSON: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/03-apply-record/APPLY_CLEAN_EASTUS2_20260727.json`
- Zero-data certification record: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/04-zero-data-certification/ZERO_DATA_CERTIFICATION_20260727.json`
- Clean zero-data certification record: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/04-zero-data-certification/ZERO_DATA_CERTIFICATION_CLEAN_EASTUS2_20260727.json`
- Shared PostgreSQL/RLS/conformance summary: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/05-postgres-migration-rls/POSTGRES_MIGRATION_RLS_CONFORMANCE_20260727.json`
- Schema migration logs: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/05-postgres-migration-rls/migration-job-logs-20260727.txt`
- RLS retry logs: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/05-postgres-migration-rls/rls-job-retry2-logs-20260727.txt`
- Generic projection fixture logs: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/05-postgres-migration-rls/generic-projection-fixture-retry2-logs-20260727.txt`

## Known Gaps

- Airline source corpus remains blocked before freeze.
- Empty Azure apply was attempted and blocked by PostgreSQL regional provisioning restriction in `eastus`; deployment canceled after evidence capture.
- Clean `eastus2` empty infrastructure apply passed; zero-data certification passed with expected private-network limits for local blob data-plane reads.
- Partial `eastus` zero-data resource group remains as cleanup debt and must not be used for source landing or publication.
- Shared empty database schema/RLS was applied.
- No source files were landed.
- No source-backed Knowledge Baseline was published.
- Generic fixture publication/projection was rollback-only and left no fixture rows.
