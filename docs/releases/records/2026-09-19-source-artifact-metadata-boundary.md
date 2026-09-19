# 2026-09-19-source-artifact-metadata-boundary — Source Artifact Metadata Boundary

## Release ID

`2026-09-19-source-artifact-metadata-boundary`

## Status

`candidate`

## Plain-English Summary

The default Source event page now reads a bounded, stage-scoped artifact-state
projection. Full artifact bodies and body-generation metadata remain behind the
explicit artifact-detail path instead of entering the default page payload.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 2 adapter boundary: explicit metadata-only projection for both supported Postgres access paths.
- Layer 4 product read: current-stage event-page hydration uses that bounded projection.
- Data layer: no schema, migration, loader, projection job, or tenant-data change.

## Client Applicability

- All clients: shared Source event-page read path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added one shared 17-column artifact-state metadata projection.
- Applied the same projection to both data-plane adapter implementations.
- Kept the default event-page read scoped to the viewed stage.
- Forced body and generation-metadata fields to null at the query-helper boundary.
- Returned the repaired payload contract to required Source integration CI.
- Lowered the Source integration quarantine ceiling from 13 to 12.

## QA / Validation

- PASS — focused event-route payload, adapter, and canvas-substrate query suites.
- PASS — full registered Source integration test lane.
- PASS — Source integration quarantine integrity check.
- PASS — TypeScript, ESLint, behavior tests, and release-control check.
- PASS — mutations adding body or generation metadata to the projection fail.

## Rollout Plan

Merge through the protected pull-request path after its prerequisite Source
branches, then use the repo-owned ACA deploy workflow. No migration, Azure job,
feature flag, or manual runtime operation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Assigned by the deploy workflow after merge.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming the page-load improvement in production.

## Rollback Plan

Revert the pull request to restore full-row current-stage artifact reads.

## Audit Evidence

- Pull request and CI results after publication.
- Local command output recorded in the pull-request validation summary.

## Known Gaps

The registry metadata read remains separate from artifact-state metadata. This
change does not assert a production latency improvement until signed-in timing
is captured after deployment.
