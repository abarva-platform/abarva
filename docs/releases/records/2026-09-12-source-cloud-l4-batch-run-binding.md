# 2026-09-12-source-cloud-l4-batch-run-binding — bind Layer 4 to the loaded projection run

## Release ID

`2026-09-12-source-cloud-l4-batch-run-binding`

## Status

`draft`

## Plain-English Summary

Corrects the Source cloud-package batch loader so Layer 4 activates the exact Layer 3 run that contains the loaded contract rows. It also refuses to reconcile an empty canonical-fact set before issuing the stale-row delete. This keeps successful loads visible to Contract 360 and makes empty parses fail at the point of cause.

## Layer Impact

- **Release lane:** `client-data-lane` for the governed Source data path.
- **Layer 3 (Canonical model):** adds a precondition to the existing tenant-and-dataset reconciliation; no canonical object shape changes.
- **Layer 4 (Products · Source):** changes the overlay selector to use the exact Layer 3 projection run instead of the Layer 4 operation identifier.
- **Products:** Contract 360 receives the same governed rows under the correct active run; no UI fixture or renderer fallback is added.

## Client Applicability

- All clients using the cloud-consumption package loader.
- Current validation is synthetic operator data only.
- No real-client data or production corpus is included in this release.

## Changes Included

- `scripts/source/load-cloud-consumption-package.mjs`
- `scripts/source/__tests__/load-cloud-consumption-package.test.ts`
- Canonical-fact empty-target guard and exact Layer 3 to Layer 4 run binding.

## QA / Validation

- `node --check scripts/source/load-cloud-consumption-package.mjs`.
- Static loader tests cover exact-run activation and empty-target refusal.
- CI must pass release, typecheck, lint, source layout, accessibility, and browser checks before merge.
- Governed ACA data-build proof must show Layer 2, Layer 3, and Layer 4 expected/readback parity for the same tenant, package hash, dataset version, and Layer 3 run ID.

## Rollout Plan

Merge through the protected `main` PR lane, deploy the exact merge SHA through `.github/workflows/aca-main-deploy.yml`, then run the cloud package batch in the approved ACA operator job. Execute Layer 2, Layer 3, exact-run verification, Layer 4 apply, Layer 4 verification, and signed-in Contract 360 proof in that order.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: recorded by the main ACA deploy after merge.
- ACA runtime invariant: required before calling the code live.
- Worker image invariant: required for the governed operator job.
- Live signed-in proof required: yes, for Source Contract 360 routes and all tabs.

## Rollback Plan

Revert and redeploy the code through the protected main deploy lane. The loader keeps writes transactional and does not delete canonical facts when the target set is empty. A failed Layer 4 readback rolls back the overlay activation.

## Audit Evidence

- PR, CI run, ACA deployment summary, operator proof bundle, and independent Layer 2/3/4 readback.
- Exact package SHA, dataset version, tenant key, idempotency key, and Layer 3 load-run ID.

## Known Gaps

This change fixes batch run selection and canonical reconciliation safety. It does not itself classify unrelated register contracts or invent missing evidence; those require authoritative source mappings and their own governed load.
