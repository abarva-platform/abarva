# 2026-07-30-foundation-v2-healthcare-fixture-sha - Align Foundation V2 Healthcare Fixture SHA

## Release ID

`2026-07-30-foundation-v2-healthcare-fixture-sha`

## Status

`candidate`

## Plain-English Summary

Foundation V2 Healthcare operator scripts now pin the same SHA-256 as the tracked Healthcare fixture file. This lets governed ACA jobs validate the packaged fixture and continue to schema readback instead of failing on a stale expected checksum before any database proof can run.

## Layer Impact

Layer 3 canonical data-plane proof tooling: updates only the Healthcare isolated fixture checksum contract used by Foundation V2 operator scripts. No product route, provider, active baseline, publication, V1 table, or UI surface changes.

## Client Applicability

- All clients: none directly.
- Specific clients: none named.
- Internal only: Foundation V2 Healthcare isolated golden-slice operator jobs.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `package.json` - aligns every Foundation V2 Healthcare script's expected fixture SHA with the tracked fixture hash.
- `fixtures/foundation-v2/healthcare-golden-slice/fixture-matrix.sha256` - records the tracked fixture hash.
- `docs/releases/records/2026-07-30-foundation-v2-isolated-healthcare-lane.md` - updates the earlier evidence note to the current fixture hash.

## QA / Validation

- Pass: `shasum -a 256 fixtures/foundation-v2/healthcare-golden-slice/fixture-matrix.json`.
- Pass: `npm run foundation-v2:healthcare:render-isolated-schema -- --out-dir /tmp/foundation-v2-healthcare-sha-render-check-2`.
- Pass: `npm run release:check`.
- Pass: restricted-token added-lines scan.
- Pending until merge/deploy: rerun governed ACA Healthcare schema readback with the digest-pinned runtime image.

## Rollout Plan

Merge through PR-only `main`; the repo-owned Azure Container Apps deploy workflow builds and deploys the next digest-pinned runtime image. After deployment, rerun the Healthcare schema readback job with the new image before any data load.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: verify after deploy before using the new job image.
- Worker image invariant: private operator job must be restored to its idle image and command after each run.
- Feature/env flag update path: none.
- Live signed-in proof required: no product surface changed; database job proof is required before progression.

## Rollback Plan

Revert this PR and redeploy through the repo-owned workflow if the Healthcare fixture is intentionally replaced by a different approved package. No database rollback is introduced by this checksum repair.

## Audit Evidence

- Prior governed job stopped before DB readback with a fixture SHA mismatch.
- Tracked fixture hash from `shasum -a 256 fixtures/foundation-v2/healthcare-golden-slice/fixture-matrix.json`.
- PR URL and merge commit after review.
- GitHub Actions deploy run after merge.
- Rerun proof for Healthcare schema readback after deployment.

## Known Gaps

This change does not load Healthcare data or certify the Healthcare golden slice. It only aligns the fixture validation contract so the governed database gates can continue.
