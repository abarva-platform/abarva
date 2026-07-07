# 2026-06-18-first-capital-v2-graph-edge-ids - First Capital V2 Graph Edge IDs

## Release ID

`2026-06-18-first-capital-v2-graph-edge-ids`

## Status

`candidate`

## Plain-English Summary

This follow-up fixes the First Capital V2 ACA load after the structured rows committed far enough to reach relationship graph loading. The live `enterprise_context_relationships` table requires a non-null `id`, so the JSONL graph loader now supplies a deterministic UUID per tenant relationship key.

## Layer Impact

`client-data-lane`: Changes graph edge persistence for context-ingestion loaders. Relationship upserts remain idempotent by `tenant_key,relationship_key`; the new `id` value is stable across reruns.

## Client Applicability

- All clients: Any JSONL graph load using `loadJsonlGraphEdges`.
- Specific clients: First Capital Financial V2 ACA seed job.
- Internal only: ACA/operator load path.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/context-ingestion/jsonl-graph-loader.ts`: adds stable UUID generation and writes `id` on `enterprise_context_relationships` upsert.

## QA / Validation

- Pass: `npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `git diff --check`.
- Not run yet: rebuilt seed image and next ACA/VNet load attempt.

## Rollout Plan

Merge after CI, rebuild the First Capital seed image, and rerun the ACA load now that Phase 0 schema columns are applied live.

## Rollback Plan

Revert this PR. If graph rows were written by a later job, rerun the tenant-scoped context reset before reloading.

## Audit Evidence

- Failed live execution: `fcf-v2-load-20260617202240-sc3y13q`.
- Failure reason: `jsonl_graph_edge_upsert_failed: null value in column "id" of relation "enterprise_context_relationships" violates not-null constraint`.
- Prior schema migration proof: `fcf-dim-migrate-20260617202820-zxymukv` reported record/fact dimension columns and graph view present.
- PR URL: Pending.
- CI run: Pending.
- Successful ACA load receipt: Pending.

## Known Gaps

Some relationship graph edges still log as unresolved because their endpoint IDs are not yet present in the loaded structured records. This patch fixes the hard persistence failure for resolvable edges; graph coverage completeness remains a later QA finding unless the next receipt shows unacceptable edge counts.
