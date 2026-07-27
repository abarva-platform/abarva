# 2026-07-27-airline-zero-data-azure-plan — Airline Private Data Plane What-If

## Release ID

`2026-07-27-airline-zero-data-azure-plan`

## Status

`candidate - apply blocked`

## Plain-English Summary

This release candidate creates the plan and live Azure what-if evidence for the empty Airline Demo New private data plane. It proves the planned deployment is create-only and scoped to Airline infrastructure names, then records the first empty-infrastructure apply attempt. The apply did not complete because PostgreSQL Flexible Server provisioning is restricted in `eastus` for the active subscription. Source files, parser jobs, migrations, publication and product runtime wiring remain blocked.

## Layer Impact

- Release lane: `client-data-lane`.
- Client intake: no change.
- Source adapters: no source landing or parser execution.
- Canonical model: no database migration and no accepted Knowledge writes.
- Products: no Home, Source, Tower, Moves, Intelligence/aVa, Cube, or runtime wiring.
- Azure infrastructure: plan package plus failed/canceled empty apply attempt evidence; not a certified environment.

## Client Applicability

- All clients: none.
- Specific clients: Airline Demo New only.
- Internal only: operator execution evidence.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/main.bicep`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/airdn-lab-foundation.bicep`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/airdn.lab.bicepparam`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/02-preapply-report/what-if-20260727.txt`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/02-preapply-report/WHAT_IF_SAFETY_GATE.json`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/03-apply-record/APPLY_ATTEMPT_20260727.md`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/03-apply-record/APPLY_ATTEMPT_20260727.json`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/04-zero-data-certification/ZERO_DATA_CERTIFICATION_20260727.json`
- `scripts/knowledge/validate-airline-phase1-plan.mjs`

## QA / Validation

- Pass: `az bicep build --file clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/main.bicep`
- Pass: `az bicep build --file clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/airdn-lab-foundation.bicep`
- Pass: live Azure what-if, create-only, 53 creates, 0 deletes, 0 modifies.
- Blocked: empty infrastructure apply attempted as `airdn-phase1-zero-data-apply-20260727`; PostgreSQL Flexible Server failed in `eastus` with subscription regional provisioning restriction; deployment was canceled after evidence capture.
- Blocked: zero-data certification is not complete because PostgreSQL is absent.
- Pass: `node scripts/knowledge/validate-airline-phase1-plan.mjs`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge as a plan and blocked-apply evidence package. The next action is to choose an approved PostgreSQL-capable Azure region or obtain `eastus` quota, rerun what-if, then retry empty infrastructure apply. Source landing, migrations, parser jobs, Knowledge publication, Cube deployment, and runtime wiring remain blocked.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Approved image digest: `sha256:7eb0ec9024dfcc57b42b02e3a7fd3f82ff376fb024ee1d057eabad7b05ef9160`
- ACA runtime invariant: not applicable; no shared runtime deploy.
- Worker image invariant: future successful apply must use the pinned digest in the plan.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this plan-only PR.

## Rollback Plan

The first apply attempt created partial zero-data resources and was canceled. Before retry, operators must either clean up the partial resource group or use an idempotent retry plan that accounts for existing resources. No source data rollback is required because no source files, migrations, parser jobs or publication jobs were run.

## Audit Evidence

- Raw live what-if output: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/02-preapply-report/what-if-20260727.txt`
- Machine-readable safety gate: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/02-preapply-report/WHAT_IF_SAFETY_GATE.json`
- Pre-apply report: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/02-preapply-report/PRE_APPLY_REPORT.json`
- Apply attempt record: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/03-apply-record/APPLY_ATTEMPT_20260727.md`
- Apply attempt JSON: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/03-apply-record/APPLY_ATTEMPT_20260727.json`
- Zero-data certification record: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/04-zero-data-certification/ZERO_DATA_CERTIFICATION_20260727.json`

## Known Gaps

- Airline source corpus remains blocked before freeze.
- Empty Azure apply was attempted and blocked by PostgreSQL regional provisioning restriction in `eastus`; deployment canceled after evidence capture.
- No database migration was run.
- No source files were landed.
- No Knowledge Baseline was published.
