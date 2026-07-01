# 2026-07-01-tower-top-programs-deterministic-hotfix — Tower Top Programs Deterministic Hotfix

## Release ID

`2026-07-01-tower-top-programs-deterministic-hotfix`

## Status

`candidate`

## Plain-English Summary

Tower now answers top-program budget ranking questions directly from loaded Tower program budget facts. This prevents the chat answer from exposing internal program keys or relying on Claude to format program rankings that Tower already owns.

## Layer Impact

- `global-control-lane`: Updates shared Tower answer routing for all tenants using the CIO Tower chat route.
- `client-data-lane`: No schema or data changes. The answer reads existing `cio_tower.facts` program budget values.

## Client Applicability

- All clients: Yes, for Tower top-program budget ranking questions.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/cio-tower/answer.ts`
- `src/lib/cio-tower/__tests__/answer.test.ts`

## QA / Validation

- `npx jest src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/answer-contract.test.ts --runInBand` pending for this candidate.
- `npm run release:check` pending for this candidate.
- Broader signed-in production V6 smoke found the pre-fix failure on Airline Demo: `tower-skyharbor-2` returned `cio_tower_visible_contract_validation_failed:raw_id_or_internal_key`.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the new image to `app.abarva.ai`. After deploy, rerun the signed-in Tower top-program question and then resume the broader V6 smoke.

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
- Pre-fix signed-in smoke failure: `tower-skyharbor-2` raw/internal key validation failure.
- Post-deploy ACA runtime-invariant evidence and signed-in Tower top-program smoke output.

## Known Gaps

This hotfix addresses top-program budget ranking only. Other Tower question families continue to be covered by the V6 cross-surface smoke.
