# 2026-08-22-move-current-artifact-date-filter — Moves Current Artifact Filter

## Release ID

`2026-08-22-move-current-artifact-date-filter`

## Status

`candidate`

## Plain-English Summary

Moves File Cabinet current-only results now compare generated artifact timestamps as real dates and suppress stale P3 generated artifacts after a newer target-architecture rebuild. This prevents older quarantined or downstream artifacts from appearing current beside a newly generated architecture anchor.

## Layer Impact

Layer 4 Products: Updates the Moves artifact-list API only. No tenant intake, source adapter, canonical model, data-plane loader, graph, migration, or registry behavior changes.

## Client Applicability

- All clients: Moves File Cabinet users.
- Specific clients: None named.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Parse generated artifact timestamps with `Date.parse` before comparing or sorting.
- Hide older versions of the same generated deliverable from `currentOnly=1`.
- For P3, hide generated artifacts older than the newest target-architecture anchor until they are regenerated against that anchor.
- Add regression coverage for mixed timestamp formats and stale P3 artifact suppression.

## QA / Validation

- `npx jest --runTestsByPath 'src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts' --runInBand` — pass.
- `npx eslint 'src/app/api/v1/programs/[programId]/artifacts/route.ts' 'src/app/api/v1/programs/[programId]/artifacts/__tests__/route.test.ts'` — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — pass.

## Rollout Plan

Merge by PR to `main`. The repo-owned ACA main deploy workflow will build and deploy the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be captured by the ACA deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for current-only artifact listing.

## Rollback Plan

Revert the PR and allow the repo-owned ACA workflow to deploy the prior behavior. No data rollback is required.

## Audit Evidence

PR URL, CI checks, ACA deploy run, runtime invariant output, and signed-in current-artifact API proof after deployment.

## Known Gaps

This change does not regenerate dependent P3 deliverables. It prevents them from being represented as current until regenerated after the latest target-architecture anchor.
