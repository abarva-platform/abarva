# 2026-07-30-home-knowledge-search-projection-metadata — Search Projection Metadata Preservation

## Release ID

`2026-07-30-home-knowledge-search-projection-metadata`

## Status

`candidate`

## Plain-English Summary

Search consumption rows now preserve the linked governed entity identity, display label, domain key, snippet text, and evidence references when the projection is rebuilt. This closes a projection-shaping gap where search could return accepted rows but the product could not certify the returned hit as a fully traceable governed entity.

## Layer Impact

Release lane: `client-data-lane`.

Client intake: No change.

Source adapters: No change.

Canonical model: No schema or canonical fact change.

Products: Home Knowledge search can render richer governed metadata after the approved projection build reruns.

## Client Applicability

- All clients: Search projection rebuilds use the updated metadata shape.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/processing/executor-framework.mjs`
- `scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`

## QA / Validation

- Pass: `npm run test:knowledge-process-executors`
- Pass: `node --check scripts/knowledge/processing/executor-framework.mjs`
- Pass: `node --check scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`
- Pass: `npx eslint scripts/knowledge/processing/executor-framework.mjs scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`
- Pass: `npm run release:check`

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps deploy workflow builds and deploys the updated runtime. A governed Container Apps data-build job must then rerun the consumption projection for any tenant that needs the updated live search rows.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared web runtime activation.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deployment before claiming runtime activation.
- Worker image invariant: Required after deployment before claiming runtime activation.
- Feature/env flag update path: None.
- Live signed-in proof required: Required after the projection rebuild for affected tenants.

## Rollback Plan

Revert the PR and rerun the governed consumption projection build. If the runtime has already deployed, use the repo-owned rollback/deploy path to restore the previous approved image.

## Audit Evidence

- PR and CI evidence to be attached after review.
- Focused executor tests.
- Release check output.
- Post-deploy runtime invariant proof.
- Post-rebuild signed-in Home Knowledge search proof.

## Known Gaps

This does not build `module_knowledge_packet_v1`, certify suggested questions, or mutate live data by itself. Live search rows are not corrected until the approved consumption projection build reruns.
