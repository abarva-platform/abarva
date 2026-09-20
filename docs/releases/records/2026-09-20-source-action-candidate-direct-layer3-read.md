# 2026-09-20-source-action-candidate-direct-layer3-read — Direct action-candidate projection

## Release ID

`2026-09-20-source-action-candidate-direct-layer3-read`

## Status

`candidate`

## Plain-English Summary

The Source workspace now reads legacy opportunity records and canonical
optimization opportunities directly from their Layer 3 tables. Canonical
opportunities still take precedence over matching legacy opportunity IDs.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 product projection: changes one Source workspace read query.
- Layers 1 through 3: no data, schema, adapter, or canonical-object changes.

## Client Applicability

- All clients: yes, when Source uses the database projection provider.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source workspace provider selection.

## Changes Included

- Replace the Layer 4 compatibility-view scan with direct reads from
  `source.sourcing_opportunity` and `source.optimization_opportunity`.
- Preserve canonical precedence over matching legacy opportunity IDs.
- Add behavior coverage that rejects the compatibility view in the direct
  action-candidate query.

## QA / Validation

- Focused Source portfolio-adapter suite: pass, 10 tests.
- Mutation proof: pass; restoring the compatibility-view read failed 4 tests.
- TypeScript typecheck: pass with an 8 GB Node heap.
- Focused ESLint: pass.
- Release-control and diff checks: pending final candidate readback.
- Authenticated endpoint timing and signed-in hydration: not run until the
  exact merge SHA is deployed; required before live-proven status.

## Rollout Plan

Merge through the protected pull-request lane and deploy through the repo-owned
ACA main workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: resolved by the deploy workflow.
- ACA runtime invariant: required after deployment.
- Worker image invariant: required after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the pull request and let the repo-owned ACA workflow redeploy the prior
query. No data or schema rollback is required.

## Audit Evidence

- Focused behavior and mutation tests.
- Pull request and CI runs.
- ACA deployment summary and runtime-invariant proof.
- Authenticated impact-endpoint timing before and after deployment.
- Signed-in Source workspace hydration proof.

## Known Gaps

This changes only the direct Source workspace action-candidate projection. It
does not alter the shared compatibility view or create database indexes.
