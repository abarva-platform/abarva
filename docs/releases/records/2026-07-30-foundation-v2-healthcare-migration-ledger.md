# 2026-07-30-foundation-v2-healthcare-migration-ledger - Isolate Foundation V2 Healthcare Migration Ledger

## Release ID

`2026-07-30-foundation-v2-healthcare-migration-ledger`

## Status

`candidate`

## Plain-English Summary

Foundation V2 migration tooling now records isolated Healthcare schema migrations under schema-qualified ledger names. This lets a Healthcare golden-slice lane apply the same approved schema contract after the default lane has already recorded those migration filenames, without treating the Healthcare schema as already applied.

## Layer Impact

Layer 3 canonical data-plane proof tooling: updates Foundation V2 migration apply, executor, verifier, manifest, and regression coverage for isolated schema lanes. No product route, provider, UI surface, production canonical table, active baseline, or client-facing publication is changed by this release.

## Client Applicability

- All clients: none directly.
- Specific clients: none named.
- Internal only: Foundation V2 Healthcare progressive database proof tooling.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/foundation-v2/golden-slice-support.mjs` - adds schema-qualified migration ledger names and active-render SHA readback for isolated lanes.
- `scripts/foundation-v2/apply-approved-migrations.mjs` - applies and records rendered migration SQL under the active lane ledger identity.
- `scripts/foundation-v2/execute-golden-slice-db.mjs` - validates migration presence against the active lane ledger identity and rendered SHA.
- `scripts/foundation-v2/verify-golden-slice-db.mjs` - verifies migration proof against the active lane ledger identity and rendered SHA.
- `scripts/foundation-v2/__tests__/run-golden-slice-db-executor-tests.mjs` - adds a Healthcare migration replay proving a pre-populated default ledger does not suppress the isolated Healthcare schema apply.

## QA / Validation

- `node scripts/foundation-v2/__tests__/run-golden-slice-db-executor-tests.mjs` - Pass.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps deploy workflow builds and deploys the next digest-pinned runtime image. After deployment, use the private operator job with the approved digest to apply Healthcare schema migrations, bootstrap governed identities, run schema/readback gates, and then progress the Healthcare golden slice one layer at a time.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: verify after deploy before using the new job image.
- Worker image invariant: private operator job must be restored to its idle image and command after each run.
- Feature/env flag update path: none.
- Live signed-in proof required: no product surface changed; database job proof is required before progression.

## Rollback Plan

Revert this PR and redeploy through the repo-owned workflow. Do not remove applied database ledger rows or schemas automatically; if a Healthcare apply has already started, stop progression and inspect the isolated schema before deciding any manual cleanup.

## Audit Evidence

- PR URL and merge commit after review.
- GitHub Actions deploy run after merge.
- Local replay output from `node scripts/foundation-v2/__tests__/run-golden-slice-db-executor-tests.mjs`.
- Healthcare schema migration apply proof from the private operator job after deployment.

## Known Gaps

This change does not load Healthcare data or certify the Healthcare database golden slice. It only removes the migration-ledger collision that blocked the first Healthcare schema apply.
