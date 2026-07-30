# 2026-07-30-foundation-v2-restricted-schema-readback — Handle restricted adjacent-schema probes

## Release ID

`2026-07-30-foundation-v2-restricted-schema-readback`

## Status

`candidate`

## Plain-English Summary

Foundation V2 schema readback and verification now treat permission-denied adjacent-schema checks as explicit isolation evidence instead of crashing the executor. This keeps the live database gate strict: the Foundation V2 path can proceed only when its own schema, roles, RLS policies, and migration ledger pass, while restricted non-V2 schemas remain acknowledged as inaccessible.

## Layer Impact

Layer 3 canonical data-plane proof tooling: updates the internal Foundation V2 executor and verifier readback logic only. No product projection, source data, tenant content, publication, baseline, provider, or UI route changes are included.

## Client Applicability

- All clients: none directly.
- Specific clients: none named.
- Internal only: Foundation V2 governed database execution tooling.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/foundation-v2/execute-golden-slice-db.mjs` — guards adjacent-schema existence and count probes, including transaction-safe savepoint handling during apply/preflight.
- `scripts/foundation-v2/verify-golden-slice-db.mjs` — records permission-denied adjacent-schema existence probes as isolation evidence.
- `scripts/foundation-v2/__tests__/run-golden-slice-db-executor-tests.mjs` — adds a local replay case with a restricted adjacent schema.

## QA / Validation

- `node scripts/foundation-v2/__tests__/run-golden-slice-db-executor-tests.mjs` — Pass.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps deploy workflow builds and deploys the next digest-pinned runtime image. After deployment, rerun the Foundation V2 managed-identity schema readback job before any data load.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: verify after deploy before using the new job image.
- Worker image invariant: not changed by this PR.
- Feature/env flag update path: none.
- Live signed-in proof required: no product surface changed; database job proof is required before progression.

## Rollback Plan

Revert this PR and redeploy through the repo-owned workflow. No schema migration or data rollback is required because this is executor/verifier control logic only.

## Audit Evidence

- PR URL and merge commit after review.
- GitHub Actions deploy run after merge.
- Local replay output from `node scripts/foundation-v2/__tests__/run-golden-slice-db-executor-tests.mjs`.
- Managed-identity schema readback proof from the ACA job rerun.

## Known Gaps

The change does not load data, certify the golden slice, or prove product/runtime publication. Those remain gated behind managed-identity preflight, layer execution, independent database verification, and later browser/runtime proof.
