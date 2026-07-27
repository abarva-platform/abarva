# 2026-07-27-airline-zero-data-azure-plan — Airline Private Data Plane What-If

## Release ID

`2026-07-27-airline-zero-data-azure-plan`

## Status

`candidate`

## Plain-English Summary

This release candidate creates the plan and live Azure what-if evidence for the empty Airline Demo New private data plane. It proves the planned deployment is create-only and scoped to Airline infrastructure names, while keeping the blocked source corpus out of the execution path.

## Layer Impact

- Release lane: `client-data-lane`.
- Client intake: no change.
- Source adapters: no source landing or parser execution.
- Canonical model: no database migration and no accepted Knowledge writes.
- Products: no Home, Source, Tower, Moves, Intelligence/aVa, Cube, or runtime wiring.
- Azure infrastructure: plan-only package for a future empty data-plane apply.

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
- `scripts/knowledge/validate-airline-phase1-plan.mjs`

## QA / Validation

- Pass: `az bicep build --file clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/main.bicep`
- Pass: `az bicep build --file clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/airdn-lab-foundation.bicep`
- Pass: live Azure what-if, create-only, 53 creates, 0 deletes, 0 modifies.
- Pass: `node scripts/knowledge/validate-airline-phase1-plan.mjs`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge as a plan-only package. The next action is a separately authorized empty infrastructure apply after human review. Source landing, migrations, parser jobs, Knowledge publication, Cube deployment, and runtime wiring remain blocked.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Approved image digest: `sha256:7eb0ec9024dfcc57b42b02e3a7fd3f82ff376fb024ee1d057eabad7b05ef9160`
- ACA runtime invariant: not applicable; no shared runtime deploy.
- Worker image invariant: future apply must use the pinned digest in the plan.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this plan-only PR.

## Rollback Plan

Before apply, rollback is reverting this PR. If a later apply PR is approved and executed, rollback must be handled in that apply record and must not land source data.

## Audit Evidence

- Raw live what-if output: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/02-preapply-report/what-if-20260727.txt`
- Machine-readable safety gate: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/02-preapply-report/WHAT_IF_SAFETY_GATE.json`
- Pre-apply report: `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/02-preapply-report/PRE_APPLY_REPORT.json`

## Known Gaps

- Airline source corpus remains blocked before freeze.
- No Azure apply was run.
- No database migration was run.
- No source files were landed.
- No Knowledge Baseline was published.
