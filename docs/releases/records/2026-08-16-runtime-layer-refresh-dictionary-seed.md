# 2026-08-16-runtime-layer-refresh-dictionary-seed — Runtime graph dictionary seed alignment

## Release ID

`2026-08-16-runtime-layer-refresh-dictionary-seed`

## Status

`candidate`

## Plain-English Summary

This change aligns the runtime layer refresh job with the canonical Layer 3 relationship dictionary before graph edges are materialized. The job now upserts the canonical relationship types inside the governed refresh transaction and fails early if an emitted edge type is not present in that dictionary.

## Layer Impact

**Release lane: `internal-admin`.** This is operator refresh tooling for the governed runtime layer refresh path. It does not change product routes, product UI, tenant registry activation, tenant input files, or Layer 4 projections.

- Layer 1: no client intake mutation.
- Layer 2: no adapter behavior change.
- Layer 3: refresh job now seeds the graph relationship dictionary from the canonical Layer 3 contract before writing graph edges.
- Layer 4: no product read model, Home route, Source route, cube, retrieval index, or runtime answer change.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: applies only when the governed runtime layer refresh operator job is run for an approved tenant scope.
- Internal only: data-build operator path.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/data-build/refresh-runtime-layers.ts`: imports the canonical Layer 3 relationship dictionary, verifies emitted edge types are covered, and upserts `intelligence_v6.relationship_types` before graph edge insertion.

## QA / Validation

- Pass: `npm run data-build:runtime-layer-refresh -- --out-dir /tmp/nexus-runtime-layer-refresh-dry-6705461e-dictfix --build-version runtime-layer-refresh-2026-08-16-6705461e-dictfix --input-source-version 6705461eb640f1de4a31fb98a0fd2bffecac1085 --idempotency-key runtime-layer-refresh:6705461e:meridian-skyharbor:dictfix-dry`

## Rollout Plan

Merge through PR and allow the repo-owned ACA main deploy workflow. The next governed runtime refresh operator job must run on the deployed digest-pinned image and capture write/readback proof before any product surface uses the refreshed graph.

## Deployment Authority

- Repo-owned deploy workflow: allowed if triggered by merge.
- Shared runtime mutators: none in this PR.
- Data-plane writes: not performed by this PR; only by a separately approved governed ACA operator job.
- ACA runtime invariant: required if the repo-owned deploy workflow runs.
- Live signed-in proof required: not for this operator-tooling fix; required before any later claim that product surfaces are refreshed.

## Rollback Plan

Revert this PR to restore the prior runtime refresh job behavior. If a governed job has already written rows with the aligned dictionary, rollback requires the normal runtime-layer refresh rollback/readback plan for that approved job run.

## Audit Evidence

- Local dry-run output: `/tmp/nexus-runtime-layer-refresh-dry-6705461e-dictfix/summary.json`
- Prior failed operator proof folder: `/tmp/nexus-runtime-layer-refresh-write-6705461e-s1`

## Known Gaps

- This change does not itself perform the runtime layer refresh write.
- This change does not refresh Home, Source, Vendor 360, cubes, retrieval indexes, or live answers.
