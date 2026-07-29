# 2026-07-29-airline-job-template-standardization — Airline Job Template Standardization

## Release ID

`2026-07-29-airline-job-template-standardization`

## Status

`candidate`

## Plain-English Summary

Standardizes the Airline foundation Container Apps Job infrastructure contract before the next governed execution stage. The job template now requires an explicit digest-pinned image, binds every job to the approved tenant, process, stage, private Postgres target, managed-identity database user, and starts in read-only preflight mode by default.

## Layer Impact

- `client-data-lane`: hardens the Airline clean-room execution jobs used for foundation processing.
- `internal-admin`: converts recovery-time job assumptions into checked infrastructure-as-code and validation.

## Client Applicability

- All clients: pattern is reusable for future foundation job templates.
- Specific clients: Airline foundation execution package.
- Internal only: yes, operator/runtime control.
- Public/demo only: no product UI change.
- Feature flag: none.

## Changes Included

- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/main.bicep`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/airdn.lab.bicepparam`
- `clients/airline-demo-new/20-phase1-azure-infrastructure-execution-package/01-infrastructure-as-code/airdn-lab-jobs.bicep`
- `scripts/knowledge/validate-airline-phase1-plan.mjs`

## QA / Validation

- `npm run test:airline-phase1-plan` — pass; validates the Airline Phase 1 plan and new job-template safety markers.
- `npm run test:foundation-pipeline-preflight` — pass; validates the read-only job preflight checker.
- `node --check scripts/knowledge/validate-airline-phase1-plan.mjs` — pass.
- `git diff --check` — pass.
- `npm run release:check` — pass.

## Rollout Plan

Merge through PR and normal repository deploy. This release does not apply the Bicep package to Azure. A later governed execution record must run a live what-if against the Airline resource group using an explicit `ABARVA_HCDN_IMAGE_NAME` value, review the diff, and only then apply the job-template update.

## Deployment Authority

- Repo-owned deploy workflow: yes, normal ACA deploy may include this IaC and validator in the image.
- Shared runtime mutators: none in this release.
- Approved image digest: required for any later Airline job-template apply through `ABARVA_HCDN_IMAGE_NAME`.
- ACA runtime invariant: required if this PR triggers a shared web deploy.
- Worker image invariant: required if this PR triggers a shared web deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: no product surface change; signed-in proof remains a downstream Airline activation gate.

## Rollback Plan

Revert this PR to restore the prior template contract. No live Azure job definition, tenant data, review ledger, publication, baseline, projection, provider route, or signed-in tenant identity is changed by this release.

## Audit Evidence

- PR and CI checks for this release.
- Local validation command output.
- Future live Airline job-template what-if and preflight JSON report.

## Known Gaps

This release does not apply the updated job template, run review apply, republish domains, rebuild the baseline, build projections, switch product providers, configure tenant identities, or perform signed-in proof. It only makes the approved job-template contract safe enough for the next controlled what-if/apply step.
