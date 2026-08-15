# 2026-08-15-runtime-layer-refresh-rls-readback-order — Runtime layer readback role reset

## Release ID

`2026-08-15-runtime-layer-refresh-rls-readback-order`

## Status

`candidate`

## Plain-English Summary

Corrects the runtime layer refresh readback loop so each tenant's expected row count is calculated
after resetting out of the prior tenant's authenticated role. This preserves the authenticated RLS
proof while preventing the second tenant's expected count from being filtered by the first tenant's
session context.

## Layer Impact

Release lane: `tenant-context-layer-refresh`.

Layer 1 intake: no tenant source files are changed.

Layer 2 adapters: no adapter mappings or reconciliation behavior are changed.

Layer 3 canonical graph: write-job readback proof is corrected before the scoped canonical and graph
materialization retry.

Layer 4 products: no product projection, cube, retrieval index, or runtime read model is refreshed
by this change.

## Client Applicability

- All clients: No.
- Specific clients: Only the approved scoped synthetic/demo refresh lane for `meridian-health` and
  `skyharbor-air`.
- Internal only: Governed operator-job proof path.
- Public/demo only: Synthetic demo data only.
- Feature flag: None.

## Changes Included

- Resets the database role before each tenant's expected graph-edge count in the runtime refresh
  readback loop.
- Keeps the authenticated same-tenant and cross-tenant RLS proof behavior from the prior slice.

## QA / Validation

- Pass: `node scripts/data-build/__tests__/run-runtime-layer-refresh-rls-readback-tests.mjs`
- Pass: `npx eslint scripts/data-build/refresh-runtime-layers.ts`
- Pass: `git diff --check`
- Pass: `npm run data-build:runtime-layer-refresh -- --tenant meridian-health --tenant skyharbor-air --out-dir /tmp/nexus-rls-readback-order-final-68d98500 --build-version rls-readback-order-final-68d98500 --input-source-version 68d98500e3bc015b5e67b7ab233bf3ca75b76fed --idempotency-key rls-readback-order-final-68d98500`
- Pass: `npm run release:check`.
- Not-run: governed ACA runtime refresh write/readback proof waits for merge/deploy of this correction.

## Rollout Plan

Merge through the normal PR path. After the repo-owned ACA main deployment builds the merged digest,
rerun the scoped runtime layer refresh job for the two approved tenants.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: Only the repo-owned ACA main deploy workflow.
- Approved image digest: Captured from the repo-owned main deploy before operator jobs run.
- ACA runtime invariant: Required after merge/deploy.
- Worker image invariant: Required after merge/deploy and after operator jobs restore idle.
- Feature/env flag update path: None.
- Live signed-in proof required: Later, after Layer 4 and retrieval slices complete.

## Rollback Plan

Revert this release commit and rerun the repo-owned deploy if the readback loop regresses. Do not
weaken or bypass tenant RLS proof as a rollback mechanism.

## Audit Evidence

- Failed write attempt showing ordering bug:
  `/tmp/nexus-runtime-layer-refresh-write-68d98500/04-logs.txt`
- Local dry-run artifact: `/tmp/nexus-rls-readback-order-final-68d98500/summary.json`

## Known Gaps

This change only repairs readback proof ordering. It does not itself write canonical rows,
materialize graph tables, refresh Layer 4 projections, index retrieval, or prove signed-in runtime
answers.
