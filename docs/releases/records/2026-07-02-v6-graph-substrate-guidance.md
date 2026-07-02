# 2026-07-02-v6-graph-substrate-guidance — V6 Graph Substrate Guidance

## Release ID

`2026-07-02-v6-graph-substrate-guidance`

## Status

`candidate`

## Plain-English Summary

This release adds shared agent guidance and a durable architecture standard for
the V6 enterprise graph substrate. It tells agents to fix graph semantics in
Azure Postgres before choosing Apache AGE, Cosmos DB Gremlin, Neo4j, NetworkX,
or graph visuals.

## Layer Impact

- `global-control-lane`: Updates repo-level agent instructions and architecture
  standards used by future implementation work. There is no runtime product
  behavior change in this release.

## Client Applicability

- All clients: Applies as engineering and agent guidance for all future V6 graph
  work.
- Specific clients: None.
- Internal only: Yes, this is an internal architecture/control standard.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `AGENTS.md`: Adds V6 graph substrate guidance for all agents.
- `docs/standards/V6_GRAPH_SUBSTRATE_CONTRACT.md`: Adds the graph substrate
  contract, canonical Postgres-first path, node/edge requirements, relationship
  type dictionary, quality scoring, and AGE/Cosmos decision boundary.

## QA / Validation

- `git diff --check`: passed.
- `npm run release:check`: must pass before merge.

## Rollout Plan

Merge to `main`. No Azure Container Apps image build, database migration, or
runtime rollout is required because this is documentation and agent guidance
only.

## Deployment Authority

- Repo-owned deploy workflow: Not required.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No; no runtime behavior changes.

## Rollback Plan

Revert the documentation commit if the guidance is superseded or found to be
incorrect.

## Audit Evidence

- PR diff.
- Release-check output.

## Known Gaps

This release does not create the physical graph tables or implement graph
normalization. It only records the shared standard and decision boundary.
