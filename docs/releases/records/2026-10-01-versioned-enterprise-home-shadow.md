# 2026-10-01-versioned-enterprise-home-shadow — Canonical Home Projection

## Release ID

`2026-10-01-versioned-enterprise-home-shadow`

## Status

`candidate`

## Plain-English Summary

Adds an assessment-scoped operator job that derives a shadow Home projection from accepted canonical enterprise objects. Every projected row retains its canonical object and source-record link. The job requires an independent post-commit admission proof and does not change the active Home assessment.

## Layer Impact

- Release lane: `client-data-lane`.
- Canonical model: read-only source for the projection.
- Products: writes a shadow Home projection for a synthetic lab assessment; no route or active-assessment selection changes.

## Client Applicability

- All clients: no active product behavior changes.
- Specific clients: no real-client activation.
- Internal only: governed synthetic lab job.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Canonical-to-Home row mapper and assessment-scoped projection job.
- Source-link, count, and mapping tests.

## QA / Validation

- Focused tests, typecheck, lint, release checks, physical disposable-Postgres replay, and private-job plan-only validation before merge.
- The deployed job must pass readback and write private Blob proof before any Home selection change.

## Rollout Plan

Merge by PR and deploy through the repo ACA main workflow. Run the private operator job only with the pinned image and independent readback proof URI. Projection remains shadowed pending narrative coherence and signed-in acceptance.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: record from successful main deployment.
- ACA runtime invariant: verify after deployment.
- Worker image invariant: verify required workers match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: confirm the existing active Home assessment is unchanged.

## Rollback Plan

Do not promote the shadow projection. Revert the job via PR; use a governed data job to remove its isolated projection rows if cleanup becomes necessary. No destructive cleanup is part of this release.

## Audit Evidence

- PR checks, physical replay, main deploy run, private operator job logs, and private projection proof URI.

## Known Gaps

- Shadow projection alone does not provide verified chapter narrative, aVa parity, export parity, or a CXO-ready active Home experience.
- Corrected on 2026-10-02: the governed data job the Rollback Plan refers to for removing projection rows does not exist in the repository. Once a projection's manifest has been named by a Home declaration, active or retired, its rows cannot be removed while that declaration row exists.
- The Rollout Plan's statement that the projection remains shadowed describes this release alone. A later release, `2026-10-02-home-active-assessment`, adds the job that selects a projection for Home.
