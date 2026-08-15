# 2026-08-15-runtime-layer-refresh-operator-env — ACA operator env handoff

## Release ID

`2026-08-15-runtime-layer-refresh-operator-env`

## Status

`candidate`

## Plain-English Summary

Allows the governed runtime layer refresh script to receive its tenant scope, build metadata, write mode, and proof-bundle setting from environment variables. This matches the ACA operator wrapper contract, which runs `npm run <script>` and passes execution parameters as env vars.

## Layer Impact

- `runtime-layer-refresh` lane: Enables the approved ACA operator execution path for the runtime layer refresh job.
- Layer 1: No change.
- Layer 2: No change.
- Layer 3: No schema or data change. This only enables the approved refresh job to carry explicit operator metadata.
- Layer 4: No change.

## Client Applicability

- All clients: No default behavior change.
- Specific clients: The script still refuses tenants outside the approved runtime-refresh scope.
- Internal only: ACA operator invocation path.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/data-build/refresh-runtime-layers.ts`

## QA / Validation

- Pass: `RUNTIME_LAYER_REFRESH_TENANTS=<approved-tenant-a>,<approved-tenant-b> RUNTIME_LAYER_REFRESH_OUT_DIR=/tmp/nexus-runtime-layer-refresh-env-dry-run RUNTIME_LAYER_REFRESH_BUILD_VERSION=runtime-layer-refresh-env-pr RUNTIME_LAYER_REFRESH_INPUT_SOURCE_VERSION=b4d11f366c331ef9a861d81af551993d144177c8 RUNTIME_LAYER_REFRESH_IDEMPOTENCY_KEY=runtime-layer-refresh-env-pr-b4d11f36 npm run data-build:runtime-layer-refresh`
- Pass: env-driven dry-run planned 9,786 canonical objects, 4,338 graph edges, 1,723 graph nodes, and 17 quarantined relationships with `graphTablesWritten=false`.
- Pass: env-driven out-of-scope fault injection refused an unapproved tenant with `Out-of-scope tenant refused`.
- Pass: `npm run ops:aca-job -- --plan-only --image <digest-pinned-image> --script data-build:runtime-layer-refresh --secret-env DATABASE_URL=azure-postgres-control-database-url --env RUNTIME_LAYER_REFRESH_TENANTS=<approved-tenant-a>,<approved-tenant-b> --env RUNTIME_LAYER_REFRESH_OUT_DIR=/tmp/runtime-layer-refresh-operator-proof --env RUNTIME_LAYER_REFRESH_BUILD_VERSION=runtime-layer-refresh-aca-job --env RUNTIME_LAYER_REFRESH_INPUT_SOURCE_VERSION=b4d11f366c331ef9a861d81af551993d144177c8 --env RUNTIME_LAYER_REFRESH_IDEMPOTENCY_KEY=runtime-layer-refresh-aca-job-b4d11f36 --env RUNTIME_LAYER_REFRESH_WRITE=true --env RUNTIME_LAYER_REFRESH_WRITE_APPROVED=true --env RUNTIME_LAYER_REFRESH_EMIT_PROOF_BUNDLE=true --out-dir /tmp/nexus-runtime-layer-refresh-operator-plan`
- Pass: `npx eslint scripts/data-build/refresh-runtime-layers.ts`

## Rollout Plan

Merge to main, allow the repo-owned ACA deploy workflow, then run the governed ACA operator job with digest-pinned image, explicit tenant scope, build version, input source version, idempotency key, write approval env, and proof-bundle env.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Data-plane write: Only through the governed ACA operator job with explicit approved tenant scope.
- Out-of-scope tenant mutation: Not approved.
- Live truth claims: Not approved by this record.

## Rollback Plan

Revert this release record and script change. No data rollback is required because this change does not write data by itself.

## Audit Evidence

- `/tmp/nexus-runtime-layer-refresh-env-dry-run/summary.json`
- `/tmp/nexus-runtime-layer-refresh-operator-plan/plan.json`

## Known Gaps

- This does not perform the runtime refresh.
- This does not refresh product read models.
- This does not run retrieval indexing or signed-in answer proof.
