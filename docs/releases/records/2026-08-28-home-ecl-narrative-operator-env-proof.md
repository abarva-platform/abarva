# 2026-08-28-home-ecl-narrative-operator-env-proof — Home ECL Narrative Operator Env Proof

## Release ID

`2026-08-28-home-ecl-narrative-operator-env-proof`

## Status

`candidate`

## Plain-English Summary

This change lets the Home ECL narrative generation job use the tenant and assessment selected by
the operator environment, and emits a structured proof event that the shared ACA operator wrapper can
capture from job logs. It fixes the operator handoff around the narrative writer seam without changing
the product route or canonical data model.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: no change.
- Layer 4 product projection: Home narrative rows remain disposable ECL projection output; this only
  improves the operator script that writes them.
- Operator/proof layer: adds a structured summary event for ACA job evidence.

## Client Applicability

- All clients: available wherever the Home ECL narrative job is used.
- Specific clients: none.
- Internal only: operator execution and proof capture.
- Public/demo only: none.
- Feature flag: writes still require `HOME_ECL_NARRATIVE_WRITE=true` and
  `HOME_ECL_NARRATIVE_WRITE_APPROVED=true`.

## Changes Included

- `scripts/ecl/build_home_ecl_narrative_layer.ts`
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`

## QA / Validation

- `npm run test:ecl-home-narrative-layer` — passed.
- `npm run test:npm-script-targets` — passed.
- `git diff --check` — passed.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, then run
the Home ECL narrative job through `npm run ops:aca-job` with a digest-pinned image and Key
Vault-backed database/model secrets.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by the deploy workflow after merge.
- ACA runtime invariant: required before any operator apply run uses the new image.
- Worker image invariant: required by the deploy workflow.
- Feature/env flag update path: operator job env only.
- Live signed-in proof required: after a successful narrative apply and readback.

## Rollback Plan

Revert the PR if the operator script must stop accepting env-scoped tenant or assessment values.
Previously written ECL projection rows are disposable and can be regenerated from the projection
substrate.

## Audit Evidence

- PR checks for this change.
- ACA operator job request summary and structured event output when the apply job is run.
- Post-apply readback against `ecl_projection.home_enterprise_landscape`.

## Known Gaps

This change does not itself run the model or write projection rows. That remains an operator job step.
