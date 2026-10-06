# 2026-10-06 — Move-scoped discovery smoke evidence load

## Release ID

`2026-10-06-moves-gdf-discovery-aca-smoke-load`

## Status

`candidate`

## Plain-English Summary

Adds a one-run operator job that loads eleven synthetic discovery files into one authorized demo Move as pending evidence. Each required evidence family receives one item and an unreviewed review row. The job verifies the Move's tenant and blueprint from persisted data, checks the exact source-set hash against a Move-scoped approval, and writes a proof bundle.

## Layer Impact

Release lane: `client-data-lane` for the scoped synthetic data-plane load. The operator script and manifest are available globally but do nothing without the exact Move-bound approval and job invocation.

- Layer 1 client intake: copies eleven existing fictional fixture files into a separately declared ACA source set with explicit non-attested labels.
- Layer 2 source adapter: the new job maps each fixture file to a canonical evidence item and review row, preserving source path and byte hash.
- Layer 3 canonical model: appends evidence and pending-review records for one authorized Move in Azure/Postgres.
- Layer 4 products: no surface logic changes; existing Moves review projections can read the new pending records.

## Client Applicability

- All clients: no automatic load.
- Specific clients: one synthetic demo Move, identified only by the approved manifest at execution.
- Internal only: the operator job and proof bundle.
- Public/demo only: synthetic fixture content.
- Feature flag: none.

## Changes Included

The Move-scoped dataset manifest, eleven-file ACA source set, operator job script, package command, and this record. The existing manual-UI fixture package and its declaration are unchanged.

## QA / Validation

Pass: fixture validator, governance manifest validator, manifest authorization unit tests (66), lint for the job, full TypeScript check with an 8 GiB Node heap, and release gate. Not run yet: live ACA job and post-commit readback. The job's live quality gate requires one pending item and one pending review for each of eleven required families, zero approvals, and an unchanged phase.

## Rollout Plan

Merge through a PR to `main`, let the repository-owned ACA main deploy workflow build the digest-pinned image, then submit the private operator ACA job with that digest and the exact approved source hash. This is a data-plane load only; the job never changes web traffic, web template, or worker images. Stop for a separate evidence-review decision after reporting pending counts.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` builds the required image after merge.
- Shared runtime mutators: none in this job.
- Approved image digest: record from the main deploy before executing the job.
- ACA runtime invariant: verify web template, 100% traffic revision, and required workers before claiming runtime proof.
- Worker image invariant: the operator execution uses a pinned digest and restores its idle template.
- Feature/env flag update path: none.
- Live signed-in proof required: review surface readback before later approval or phase advancement.

## Rollback Plan

Do not delete append-only evidence. If the job fails after commit, leave the evidence pending, preserve the proof and log the gap. A correction requires a new scoped decision and a new source-set hash; no automatic rollback or approval is performed.

## Audit Evidence

The PR and merge commit, manifest source-set hash, ACA execution ID and logs, Blob progress/validation/quality-gate/proof objects, post-commit database readback, and signed-in Moves review screenshot.

## Known Gaps

The eleven records remain pending and unindexed until separate review and retrieval proof. This release does not claim the fixture pack's two session artifacts or deferred redline have been loaded.
