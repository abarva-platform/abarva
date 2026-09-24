# 2026-09-23-source-frozen-dataset-acceptance-protocol — Acceptance Freeze Validator

## Release ID

`2026-09-23-source-frozen-dataset-acceptance-protocol`

## Status

`candidate`

## Plain-English Summary

Adds a read-only validator for the frozen dataset and deployment identity used during a Source signed-in acceptance walk. It invalidates a matrix when the supplied snapshot changes or a reload, migration, deploy, or projection occurs inside the window.

## Layer Impact

Release lane: `internal-admin`. The validator compares declared Layer 3 build and read-model identities with a Layer 4 acceptance record. It does not load, project, or modify data.

## Client Applicability

- All clients: No direct product-surface change.
- Specific clients: None.
- Internal only: Yes, acceptance operators.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Add a typed, fail-closed freeze comparison and a read-only JSON-pair CLI.
- Document the required source readbacks and limits of the validator.

## QA / Validation

- Pass: 16 focused Jest tests cover changed identities, all four in-window mutation kinds, missing or malformed checksums, ambiguous timestamps, observations outside the window, and nonzero CLI exit on an in-window projection.
- Pass: mutating the projection/read-model map comparison to accept all maps caused two focused tests to fail; the guard was restored and the suite passed.
- Pass: scoped ESLint. Full TypeScript and release checks were rerun after release-record correction; CI and live product acceptance are not run at this candidate stage.

## Rollout Plan

Merge after review and applicable CI. No migration, data build, feature flag, or runtime invocation is required for the read-only operator CLI. Any routine ACA main deploy caused by the merge is proved separately and does not imply acceptance.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` if the merge triggers a shared release.
- Shared runtime mutators: None from this branch.
- Approved image digest: Owed after any deployment.
- ACA runtime invariant: Owed after any deployment.
- Worker image invariant: Owed after any deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: No product surface changes; a real acceptance walk remains separately owed.

## Rollback Plan

Revert the validator and documentation. Preserve previously captured baseline, observations and invalidation reasons as audit evidence.

## Audit Evidence

Reviewed PR, red/green and mutation test output, CI, and independently sourced acceptance manifests. No live freeze is claimed by this release.

## Known Gaps

The validator does not collect live dataset or runtime evidence, freeze tenant writes, apply migrations, generate the step matrix, or approve governed decisions. An operator must establish those facts independently.
