# 2026-07-01-tower-budget-lineage-contract-hotfix — Tower Budget Lineage Contract Hotfix

## Release ID

`2026-07-01-tower-budget-lineage-contract-hotfix`

## Status

`candidate`

## Plain-English Summary

Tower now treats IT budget lineage questions as governed budget-metric questions instead of falling through to the generic top-programs answer path. For questions such as "Show metric lineage for the IT budget answer," Tower answers from the same governed metric packet used by the dashboard and returns the visible-answer contract deterministically.

## Layer Impact

- `global-control-lane`: Updates shared Tower answer routing and deterministic answer behavior for all tenants using the CIO Tower chat route.
- `client-data-lane`: No data model or client data changes. The answer reads existing `cio_tower.measure_results` packets.

## Client Applicability

- All clients: Yes, for Tower budget lineage questions.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/cio-tower/answer.ts`
- `src/lib/cio-tower/__tests__/answer.test.ts`

## QA / Validation

- `npx jest src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/answer-contract.test.ts --runInBand` passed.
- `git diff --check` passed.
- Pre-fix signed-in production check reproduced the failure on Industrial Demo Tower lineage with `cio_tower_visible_contract_parse_failed`, confirming the hotfix target.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the new image to `app.abarva.ai`. After deploy, rerun the signed-in Industrial Demo Tower lineage check and then the cross-surface V6 smoke.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the approved ACA deploy workflow.
- Approved image digest: To be captured by the ACA deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this hotfix PR and redeploy the prior known-good ACA image through the repo-owned main deploy workflow. No schema rollback is required.

## Audit Evidence

- Hotfix PR and CI checks.
- Pre-fix focused production smoke output: `/tmp/v6-contract-focused-tower-lineage.json`.
- Post-deploy ACA runtime-invariant evidence and signed-in Tower lineage smoke output.

## Known Gaps

This hotfix addresses budget lineage routing and deterministic output only. Broader Tower answer-quality scoring remains covered by the separate V6 cross-surface smoke and Golden-style evaluations.
