# 2026-08-15-runtime-layer-refresh-independent-readback — Runtime refresh committed-state verifier

## Release ID

`2026-08-15-runtime-layer-refresh-independent-readback`

## Status

`candidate`

## Plain-English Summary

Adds a read-only verifier for the scoped runtime layer refresh. The verifier reads committed
`intelligence_v6` runtime refresh rows for the approved build/idempotency key, checks expected
counts, and exercises authenticated tenant RLS so each scoped tenant can see its own rows and not
the other scoped tenant's rows.

## Layer Impact

Release lane: `tenant-context-layer-refresh`.

Layer 1 intake: no tenant source files are changed.

Layer 2 adapters: no adapter mappings or reconciliation behavior are changed.

Layer 3 canonical graph: committed-state readback proof is added for already-written canonical
records, raw relationship edges, graph nodes, graph edges, and graph quality reports.

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

- Adds `scripts/data-build/verify-runtime-layer-refresh-readback.ts`.
- Adds package script `data-build:runtime-layer-refresh:readback`.
- Extends the static RLS guard test to verify the readback script is read-only, tenant-scoped, and
  exercises `SET LOCAL ROLE authenticated`.

## QA / Validation

- Pass: `node scripts/data-build/__tests__/run-runtime-layer-refresh-rls-readback-tests.mjs`
- Pass: `npx eslint scripts/data-build/verify-runtime-layer-refresh-readback.ts`
- Pass: `git diff --check`
- Pass: `npm run release:check`
- Pass: out-of-scope local smoke refused `apex-retail`.
- Blocked locally as expected: in-scope committed-state readback requires `ABARVA_AZURE_DATABASE_URL`,
  `AZURE_DATABASE_URL`, or `DATABASE_URL` and must run in the governed ACA operator.
- Pending after merge/deploy: ACA read-only committed-state proof for build
  `runtime-layer-refresh-b321f585-s1`.

## Rollout Plan

Merge through the normal PR path. After the repo-owned ACA main deployment builds the merged digest,
run the read-only verifier through the digest-pinned ACA operator job with database access projected
from Key Vault.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: Only the repo-owned ACA main deploy workflow.
- Approved image digest: Captured from the repo-owned main deploy before operator jobs run.
- ACA runtime invariant: Required after merge/deploy.
- Worker image invariant: Required after merge/deploy and after operator jobs restore idle.
- Feature/env flag update path: None.
- Live signed-in proof required: Later, after Layer 4 and retrieval slices complete.

## Rollback Plan

Revert this report-only verifier and package script. No data rollback is needed because the verifier
does not mutate runtime or tenant data.

## Audit Evidence

- Runtime write proof bundle waiting for independent readback:
  `/tmp/nexus-runtime-layer-refresh-write-b321f585/proof.tgz`
- Local missing-DB boundary:
  `/tmp/nexus-readback-local-missing-db`
- Static guard: `scripts/data-build/__tests__/run-runtime-layer-refresh-rls-readback-tests.mjs`

## Known Gaps

This change only adds independent committed-state readback tooling. It does not itself write
canonical rows, materialize graph tables, refresh Layer 4 projections, index retrieval, or prove
signed-in runtime answers.
