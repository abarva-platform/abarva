# 2026-09-30 Segment Write Manifest Gate

## Release ID

`2026-09-30-segment-write-manifest-gate`

## Status

`candidate`

## Plain-English Summary

A runtime canonical refresh that includes newly mapped business-segment data now refuses to write unless an approved, tenant-specific dataset manifest matches the exact registered source files, their content hashes, and the expected object count. A general refresh can no longer pick up the new family merely because its adapter is installed. No manifest is created or approved by this release, and no tenant data is loaded.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 1: reads only the active input root declared by the tenant input registry for source-set validation.
- Layer 2: no adapter change.
- Layer 3: adds a pre-connection write gate to the existing runtime canonical/graph refresh job.
- Layer 4: no product read or presentation change.

## Client Applicability

- All clients: shared runtime refresh enforces the gate whenever a segment record or declared segment candidate appears.
- Specific clients: none are loaded or promoted.
- Internal only: dry-run remains available for review without a manifest.
- Public/demo only: no surface change.
- Feature flag: none.

## Changes Included

- Require a single canonical tenant scope and a safe manifest ID before a segment-bearing write.
- Validate the manifest's approval fields, tenant, source layer, ACA Job ingestion method, retrieval-proof requirement, exact registered source-file hashes and object count.
- Keep non-segment refreshes unaffected; a segment dry-run still shows its proposed and withheld links without writing data.
- Add planted failures for missing approval, changed source bytes, wrong scope and count, and multi-tenant reuse.

## QA / Validation

- Six focused gate tests: passed.
- TypeScript typecheck: passed.
- Touched-file ESLint and release check: passed.
- Behavior coverage and PR CI: pending at release-record creation; the behavior suite is unchanged by this operator guard.
- No database connection, tenant write, manifest approval, or signed-in segment proof is claimed.

## Rollout Plan

Merge through a protected PR and deploy only through the repo-owned ACA main workflow. The gate is active in the operator script when the image is deployed. A separately reviewed manifest and digest-pinned ACA Job are required before a scoped data load; job quality and human review still gate Home publication.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only for shared web traffic.
- Shared runtime mutators: none in this release.
- Approved image digest: determined by the main deploy run.
- ACA runtime invariant: verify web template, 100%-traffic revision, and required worker jobs after deployment.
- Worker image invariant: must match the approved digest.
- Feature/env flag update path: the operator job must explicitly supply the approved manifest ID; this PR sets no runtime flag.
- Live signed-in proof required: confirm existing Home state remains honest; no segment data is claimed live.

## Rollback Plan

Revert through protected main and the approved deploy workflow. This removes the additional pre-write guard; no tenant data or schema reversal is involved. Do not run a segment-bearing write under the prior image without a separate approved break-glass review.

## Audit Evidence

Inspect the PR, focused tests, required CI, ACA deploy, and signed-in Home record-state check. A future data-build proof bundle is a separate artifact.

## Known Gaps

- No dataset-specific manifest or human approval exists yet for the new segment source set.
- Canonical segment records and relationships remain unpromoted until a separate governed job passes review.
- Home serving and narrative coherence remain separate work.
