# 2026-06-13-env-naming-tags-budgets — Environment Naming, Tags, and Budget Baseline

## Release ID

`2026-06-13-env-naming-tags-budgets`

## Status

`candidate`

## Plain-English Summary

Adds the enforceable naming, required-tag, and budget-control baseline for AbarVa's product-development subscriptions and future client private data-plane subscriptions. This protects us from resource-name drift, missing ownership/cost tags, real client names in Azure resource names, and runtime workloads without budgets.

## Layer Impact

- `global-control-lane`: Adds policy-as-code for subscription/resource naming, tagging, and budget expectations.
- `internal-admin`: Defines the cost-control and evidence baseline future Azure provisioning must satisfy.

## Client Applicability

- All clients: Applies to future client private data-plane environment creation.
- Specific clients: None.
- Internal only: Applies immediately to AbarVa product-development environment planning.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `docs/azure/ENVIRONMENT_NAMING_TAGGING_BUDGETS_2026-06.md`
- `docs/azure/ENVIRONMENT_NAMING_TAGGING_BUDGETS_2026-06.json`
- `scripts/azure/verify-environment-cost-controls.mjs`
- `npm run azure:environment-cost-controls:verify`
- Production-readiness CI gate verifies the naming/tagging/budget baseline.

## QA / Validation

- PASS — `npm run azure:environment-cost-controls:verify`
- PASS — `npm run azure:environment-factory:verify`
- PASS — `npm run azure:environment-vending:verify`
- PASS — `npm run azure:environment-rbac:verify`
- PASS — `npm run release:check`

## Rollout Plan

Merge to main. No Azure resources, tags, budgets, subscriptions, runtime workloads, or DNS records are created or changed in this slice.

Future provisioning/IaC slices must satisfy this baseline before creating workloads.

## Rollback Plan

Revert this PR to remove the baseline and CI verifier. No Azure rollback is required because this slice is non-mutating.

## Audit Evidence

- PR diff and CI output.
- Verifier output from `npm run azure:environment-cost-controls:verify`.
- This release record.

## Known Gaps

Actual Azure tags and budgets are not applied in this slice. Applying them is a later Azure execution step and may require explicit approval if it mutates live resources.
