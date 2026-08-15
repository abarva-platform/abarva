# 2026-08-15-runtime-layer-refresh-rls-readback — Runtime layer RLS readback proof

## Release ID

`2026-08-15-runtime-layer-refresh-rls-readback`

## Status

`candidate`

## Plain-English Summary

Tightens the Intelligence V6 runtime layer refresh proof path after the first governed write attempt
matched row counts but failed tenant-isolation readback. The refresh job now exercises the tenant
isolation check through the authenticated role instead of the operator connection, and the
tenant-scoped runtime tables force row-level security.

## Layer Impact

Release lane: `tenant-context-layer-refresh`.

Layer 1 intake: no tenant source files are changed.

Layer 2 adapters: no adapter mappings or reconciliation behavior are changed.

Layer 3 canonical graph: readback proof for canonical and graph writes now validates same-tenant
visibility and cross-tenant invisibility under an authenticated tenant context.

Layer 4 products: no product projection, cube, retrieval index, or runtime read model is refreshed
by this change.

## Client Applicability

- All clients: No.
- Specific clients: Only the approved scoped synthetic/demo refresh lane for `meridian-health` and
  `skyharbor-air`.
- Internal only: Governed operator-job proof path and migration.
- Public/demo only: Synthetic demo data only.
- Feature flag: None.

## Changes Included

- Added FORCE ROW LEVEL SECURITY for the tenant-scoped `intelligence_v6` runtime refresh tables.
- Updated runtime refresh readback to set tenant context and `SET LOCAL ROLE authenticated` for the
  RLS proof query.
- Added a static guard test covering the authenticated-role readback path and FORCE RLS migration.

## QA / Validation

- Pass: `node scripts/data-build/__tests__/run-runtime-layer-refresh-rls-readback-tests.mjs`
- Pass: `npm run data-build:runtime-layer-refresh -- --tenant meridian-health --tenant skyharbor-air --out-dir /tmp/nexus-rls-readback-fix-final-0e8880d7 --build-version rls-readback-fix-final-0e8880d7 --input-source-version 0e8880d76a9e8767384e240c67b4a5bda0f75813 --idempotency-key rls-readback-fix-final-0e8880d7`
- Pass: `git diff --check`
- Pass: `npx eslint scripts/data-build/refresh-runtime-layers.ts`
- Pass: `npm run release:check`
- Pending after merge/deploy: governed ACA migration apply and runtime refresh write/readback proof.

## Rollout Plan

Merge through the normal PR path. After the repo-owned ACA main deployment builds the merged digest,
run pending migrations through the governed ACA operator job, then rerun the scoped runtime layer
refresh job for the two approved tenants.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: Only the repo-owned ACA main deploy workflow.
- Approved image digest: Captured from the repo-owned main deploy before operator jobs run.
- ACA runtime invariant: Required after merge/deploy.
- Worker image invariant: Required after merge/deploy and after operator jobs restore idle.
- Feature/env flag update path: None.
- Live signed-in proof required: Later, after Layer 4 and retrieval slices complete.

## Rollback Plan

Revert this release commit and rerun the repo-owned deploy if the authenticated RLS readback path
regresses. The additive FORCE RLS migration can be superseded by a later migration only after a
security review; do not weaken RLS as part of normal rollback.

## Audit Evidence

- Failed write attempt that triggered this fix:
  `/tmp/nexus-runtime-layer-refresh-write-56d7e489/04-logs.txt`
- Local dry-run artifact: `/tmp/nexus-rls-readback-fix-final-0e8880d7/summary.json`
- Static guard: `scripts/data-build/__tests__/run-runtime-layer-refresh-rls-readback-tests.mjs`

## Known Gaps

This change only repairs RLS proof/readback. It does not itself write canonical rows, materialize
graph tables, refresh Layer 4 projections, index retrieval, or prove signed-in runtime answers.
