# 2026-07-30-foundation-v2-healthcare-fixture-runtime - Package Foundation V2 Healthcare Fixture

## Release ID

`2026-07-30-foundation-v2-healthcare-fixture-runtime`

## Status

`candidate`

## Plain-English Summary

The Azure runtime image now includes the approved Foundation V2 Healthcare golden-slice fixture directory used by private Container Apps Jobs. The previous image contained the default golden-slice fixture but not the Healthcare fixture, so Healthcare schema readback failed before it could reach the database.

## Layer Impact

Layer 3 canonical data-plane proof tooling: packages the isolated Healthcare fixture and release contract into the runtime image used by governed ACA jobs. No product route, product UI, provider, live baseline, V1 table, or client-facing publication changes.

## Client Applicability

- All clients: none directly.
- Specific clients: none named.
- Internal only: Foundation V2 Healthcare isolated golden-slice operator jobs.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `Dockerfile` - copies `fixtures/foundation-v2/healthcare-golden-slice` into the runtime image alongside the existing default golden-slice fixture.

## QA / Validation

- `npm run lint -- Dockerfile` is not applicable because Dockerfile is not an ESLint target.
- `npm run release:check` - Pass.
- Live failure evidence: ACA execution `job-abarva-private-operator-eus-92djkyh` failed before DB access with missing `fixtures/foundation-v2/healthcare-golden-slice/fixture-matrix.json`.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps deploy workflow builds and deploys the next digest-pinned runtime image. After deployment, rerun the Healthcare schema readback job with the new image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: verify after deploy before using the new job image.
- Worker image invariant: private operator job must be restored to its idle image and command after each run.
- Feature/env flag update path: none.
- Live signed-in proof required: no product surface changed; database job proof is required before progression.

## Rollback Plan

Revert this PR and redeploy through the repo-owned workflow. No database changes are introduced by this packaging fix.

## Audit Evidence

- PR URL and merge commit after review.
- GitHub Actions deploy run after merge.
- Rerun proof for Healthcare schema readback after the image includes the fixture directory.

## Known Gaps

This change does not certify the Healthcare golden slice. It only makes the approved Healthcare fixture available to the governed runtime job so schema readback and downstream gates can execute.
