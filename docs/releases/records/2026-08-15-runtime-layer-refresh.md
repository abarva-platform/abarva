# 2026-08-15-runtime-layer-refresh — Governed runtime layer refresh job

## Release ID

`2026-08-15-runtime-layer-refresh`

## Status

`candidate`

## Plain-English Summary

Adds the governed job path for refreshing canonical records and resolved graph edges into the runtime data plane. The job is tenant-scoped, digest-image-ready for the ACA operator wrapper, and emits a proof bundle with canonical, graph, quarantine, and refresh-state counts.

## Layer Impact

- Layer 1: Read-only source input. The job reads active tenant input packages and refuses out-of-scope tenants.
- Layer 2: Reuses deterministic adapter/reconciliation output; no adapter output becomes truth.
- Layer 3: Adds additive `intelligence_v6` canonical record and raw relationship-edge landing tables plus a refresh-run ledger.
- Layer 3 graph: Extends the relationship dictionary and writes only resolved graph nodes/edges; unresolved rows remain quarantined.
- Layer 4: Not refreshed in this slice. Product read-model refresh remains a later step after data-plane proof.

## Client Applicability

- All clients: No default runtime behavior change.
- Specific clients: Two approved synthetic/demo tenant keys only for the governed operator job.
- Internal only: Operator job, migration, and proof artifacts.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `supabase/migrations/20260815162000_intelligence_v6_runtime_layer_refresh.sql`
- `scripts/data-build/refresh-runtime-layers.ts`
- `src/lib/enterprise-data/canonical-build/canonical-tenant-data-build.ts`
- `reports/runtime-layer-refresh/latest/`
- `package.json`

## QA / Validation

- Pass: `npm run data-build:runtime-layer-refresh -- --tenant <approved-tenant-a> --tenant <approved-tenant-b> --build-version runtime-layer-refresh-pr1 --input-source-version fd8380a304d6bf3e8885328d4934e01352a933cc --idempotency-key runtime-layer-refresh-pr1-fd8380a3 --out-dir reports/runtime-layer-refresh/latest`
- Pass: out-of-scope fault injection refused an unapproved tenant with `Out-of-scope tenant refused`.
- Pass: `npx eslint scripts/data-build/refresh-runtime-layers.ts src/lib/enterprise-data/canonical-build/canonical-tenant-data-build.ts`
- Pass: `git diff --check`
- Pass: `npm run audit:tenant-input-quality -- --out-dir /tmp/nexus-runtime-layer-refresh-tenant-quality`

## Rollout Plan

Merge to main, allow the repo-owned ACA main deploy workflow to build and deploy the approved digest, then run the mutating refresh through `npm run ops:aca-job` using `data-build:runtime-layer-refresh` with explicit tenant scope, build version, input source version, idempotency key, and proof output. Local execution remains dry-run unless `--write` and `RUNTIME_LAYER_REFRESH_WRITE_APPROVED=true` are both present in the governed job.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: Only the repo-owned ACA main deploy workflow.
- Approved image digest: To be captured from the main deploy before the ACA operator job.
- ACA runtime invariant: Required after merge/deploy.
- Worker image invariant: Required before and after the ACA operator job.
- Feature/env flag update path: None.
- Live signed-in proof required: Later S5 after L4 and retrieval slices complete.

## Rollback Plan

Code rollback is a normal revert PR followed by the repo-owned ACA deploy workflow. Data rollback is scoped by `build_version`, `input_source_version`, `idempotency_key`, `contract_version`, and tenant scope; delete or supersede only rows from this refresh run after explicit operator approval.

## Audit Evidence

- `reports/runtime-layer-refresh/latest/summary.json`
- `reports/runtime-layer-refresh/latest/summary.md`
- `reports/runtime-layer-refresh/latest/canonical-build/`
- `reports/runtime-layer-refresh/latest/graph-reconciliation/`

## Known Gaps

- This slice does not refresh Layer 4 projections.
- This slice does not run retrieval indexing.
- This slice does not claim live signed-in answer proof.
