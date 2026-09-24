# 2026-09-24-moves-fixture-packet-cabinet-quarantine — Moves File Cabinet control-packet quarantine

## Release ID

`2026-09-24-moves-fixture-packet-cabinet-quarantine`

## Status

`candidate`

## Plain-English Summary

Moves Files & Evidence now fails closed when a generated-deliverable vault row is identifiable as a smoke-test or fixture control packet. Those rows are returned as `quarantined` with a visible caveat instead of inheriting an `approved` or `ready` status that could make test instructions look like a client-facing deliverable.

## Layer Impact

- `global-control-lane`: Layer 4 products: updates the Moves File Cabinet API response classification for current artifact rows. It does not change tenant intake, adapters, canonical records, generated document bytes, data-plane state, or runtime routing.

## Client Applicability

- All clients: applies wherever Moves Files & Evidence lists generated-deliverable artifact rows.
- Specific clients: none.
- Internal only: smoke-test/control packet language remains operator/testing evidence and is not promoted as a client deliverable.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/app/api/v1/programs/[programId]/artifacts/route.ts` quarantines generated-deliverable rows whose title, file name, or metadata match fixture/control packet markers.
- `src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts` proves an approved-looking control packet is returned as `quarantined` with a review caveat and open item.

## QA / Validation

- `npm run test -- --runTestsByPath 'src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts' --runInBand` — passed, 12/12 tests.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the image. No manual data mutation, migration, registry activation, or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: captured by the ACA deploy workflow after merge.
- ACA runtime invariant: verify web template image, 100% traffic revision image, and latest ready revision image after deploy.
- Worker image invariant: verify worker job images remain aligned with the deployed digest.
- Feature/env flag update path: none.
- Live signed-in proof required: Files & Evidence should no longer present matching control packets as ready/approved generated deliverables.

## Rollback Plan

Revert the PR and redeploy through the repo-owned workflow. Rollback only restores the previous display classification behavior; it does not mutate artifact bytes or tenant data.

## Audit Evidence

- Pull request URL: to be added when opened.
- Unit test output: route test listed above.
- Post-merge ACA workflow run and runtime invariant proof.

## Known Gaps

- This does not delete or rewrite any existing artifact row. It changes how matching control-packet rows are classified to reviewers.
- Full Office-byte scanning remains handled by the generated-artifact readiness scanner and sign-off gates, not by the File Cabinet list endpoint.
