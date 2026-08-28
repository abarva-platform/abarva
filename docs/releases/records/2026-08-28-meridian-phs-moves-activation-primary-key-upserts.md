# 2026-08-28-meridian-phs-moves-activation-primary-key-upserts — Moves Activation Primary-Key Upserts

## Release ID

`2026-08-28-meridian-phs-moves-activation-primary-key-upserts`

## Status

`candidate`

## Plain-English Summary

This release makes the Meridian/PHS Moves activation package use deterministic primary-key upserts for the rows it generates. The operator job remains idempotent without depending on natural-key uniqueness assumptions that may not exist in the target schema.

## Layer Impact

Release lane: `client-data-lane`.

Layer 2/4 data-build control: the governed Moves activation package generation is updated. No product rendering code is changed by this release record.

## Client Applicability

- All clients: no default runtime behavior change.
- Specific clients: Meridian/PHS demo activation job.
- Internal only: governed operator execution path.
- Public/demo only: Meridian/PHS demo readiness.
- Feature flag: none.

## Changes Included

- `scripts/ecl/write_meridian_phs_moves_activation_plan.mjs`
- `scripts/ecl/__tests__/run-meridian-phs-moves-activation-execute-tests.mjs`

## QA / Validation

- `npm run test:ecl-meridian-phs-moves-activation-execute` passed locally.
- Plan-only generation produced the expected 38 Moves and 228 rows each for modules, milestones, and work items.
- The generated SQL is asserted to use `ON CONFLICT (id)` and reject unsupported natural-key conflict targets.

## Rollout Plan

Merge through PR, then deploy through the repo-owned Azure Container Apps main deploy workflow before rerunning the governed ACA operator job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned deploy workflow
- Approved image digest: resolved by the deploy workflow after merge
- ACA runtime invariant: required before live-proof claim
- Worker image invariant: required by deploy workflow
- Feature/env flag update path: none
- Live signed-in proof required: not applicable to this data-build package fix

## Rollback Plan

Revert this release commit and redeploy through the repo-owned ACA main deploy workflow. No data-plane rollback is required if the operator job has not been rerun.

## Audit Evidence

- Local focused activation-execute test output.
- Failed operator-job proof directory retained under `/tmp` for diagnosis.

## Known Gaps

The governed operator job must be rerun from an image that includes this fix before the Moves demo activation can be claimed loaded.
