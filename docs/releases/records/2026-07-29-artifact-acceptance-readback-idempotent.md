# 2026-07-29-artifact-acceptance-readback-idempotent — Rerunnable Artifact Acceptance Readback

## Release ID

`2026-07-29-artifact-acceptance-readback-idempotent`

## Status

`candidate`

## Plain-English Summary

The lab database migration workflow includes a repository readback that writes and reads a synthetic Source artifact acceptance to prove the repository path works. That verifier used a fixed synthetic event code, so a later migration run could fail on the expected unique event-code constraint even when the database schema was healthy. This change makes the synthetic verification fixture unique per run so the governed migration lane can be rerun cleanly.

## Layer Impact

- Operations: improves the repeatability of the lab database migration verification workflow.
- Source: touches only the synthetic verifier used by the migration lane; it does not change Source product behavior or real tenant artifacts.

## Client Applicability

- All clients: none directly.
- Specific clients: none.
- Internal only: governed lab database migration verification.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/source/verify-artifact-acceptances-readback.ts`

## QA / Validation

- pass — TypeScript/source inspection confirms the verifier still writes only under the synthetic verification tenant and keeps downstream context excluded.
- pass — `npx jest src/lib/source/__tests__/artifact-acceptances.test.ts --runInBand`
- pending — `npm run release:check` will be rerun after this release-record wording update.

## Rollout Plan

Merge to main, let the normal Azure Container Apps main deploy publish the new image, then rerun the governed `Database migration — lab` workflow. No manual database mutation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned main deploy workflow after merge.
- ACA runtime invariant: required before rerunning the migration workflow with this verifier.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no; this is an internal migration-lane verifier fix.

## Rollback Plan

Revert this PR if needed. Existing synthetic verification rows are append-only and excluded from downstream context.

## Audit Evidence

- PR and CI checks for this change.
- Follow-up `Database migration — lab` run after the new image is deployed.

## Known Gaps

This does not apply review decisions, publish Knowledge domains, activate a baseline, build projections, or switch product providers.
