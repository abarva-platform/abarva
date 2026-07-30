# 2026-07-30-foundation-v2-gate-fingerprint-order — Pin gate fingerprint ordering

## Release ID

`2026-07-30-foundation-v2-gate-fingerprint-order`

## Status

`candidate`

## Plain-English Summary

Foundation V2 database verification now orders gate proof rows by the declared L0-L12 transition sequence instead of relying on runtime or database string collation. This removes a false negative where persisted row and field counts matched exactly, but the final persistence fingerprint failed because one environment ordered `L10` before `L1`.

## Layer Impact

Layer 3 canonical data-plane proof tooling: updates only the Foundation V2 executor and verifier fingerprint/readback order contract. No product projection, tenant content, publication, baseline, provider, UI route, or schema migration is included.

## Client Applicability

- All clients: none directly.
- Specific clients: none named.
- Internal only: Foundation V2 governed database execution tooling.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/foundation-v2/golden-slice-support.mjs` — adds a declared transition-order comparator and SQL order expression for gate proof rows.
- `scripts/foundation-v2/execute-golden-slice-db.mjs` — uses the declared gate order for persistence fingerprint readback.
- `scripts/foundation-v2/verify-golden-slice-db.mjs` — uses the declared gate order for persistence fingerprint and gate proof readback.
- `scripts/foundation-v2/__tests__/run-golden-slice-db-executor-tests.mjs` — adds a regression check for `L1` versus `L10` gate ordering.

## QA / Validation

- `node scripts/foundation-v2/__tests__/run-golden-slice-db-executor-tests.mjs` — Pass.
- One-off replay against the extracted Azure verifier proof showed the expected and persisted fingerprints match after applying the declared gate order.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps deploy workflow builds and deploys the next digest-pinned runtime image. After deployment, rerun the Foundation V2 managed-identity reader verification job against the already-applied golden-slice data.

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
- Managed-identity reader verification proof from the ACA job rerun.

## Known Gaps

The change does not load new data or prove product/runtime publication. It only fixes the deterministic proof contract needed to certify the already-applied isolated golden slice.
