# 2026-10-01-versioned-enterprise-readback — Post-Commit Admission Proof

## Release ID

`2026-10-01-versioned-enterprise-readback`

## Status

`candidate`

## Plain-English Summary

Adds an independent, read-only check of a versioned synthetic enterprise assessment after intake commits. It compares persisted source, canonical, application-grain, relationship, and lineage counts with the pinned source contract. A failed comparison blocks the next projection step.

## Layer Impact

- Release lane: `internal-admin`.
- Client intake and canonical model: read-only verification, no records changed.
- Products: no route or serving selection changed.

## Client Applicability

- All clients: no product behavior changes.
- Specific clients: none.
- Internal only: governed synthetic lab operator job.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- A version-specific post-commit readback job and npm entry point.
- Admission comparison tests.

## QA / Validation

- Typecheck, focused test, lint, release checks, and job plan-only validation before merge.
- Post-deploy private ACA readback job must pass and emit immutable Blob proof before projection work proceeds.

## Rollout Plan

Merge by PR, deploy the approved image through the repo-owned ACA main workflow, and run the read-only job in the private operator lane. The job does not promote an assessment.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: record from successful main deployment.
- ACA runtime invariant: verify after deployment.
- Worker image invariant: verify required worker jobs match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: confirm the existing Home assessment remains on screen.

## Rollback Plan

Stop running the readback job or revert this PR through the normal release lane. It does not write tenant or product data.

## Audit Evidence

- PR checks, main deploy run, private operator job logs and Blob readback proof.

## Known Gaps

- A passing admission check does not mean the new assessment is projected, promoted, or visible in Home.
