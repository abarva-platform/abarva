# 2026-09-30-source-final-registry-date — Accepted Final Timestamp Readback

## Release ID

`2026-09-30-source-final-registry-date`

## Status

`candidate`

## Plain-English Summary

Source preserves the acceptance timestamp of a reviewed final when the Postgres driver returns it as a Date object. This lets the existing authority check recognize that final without creating or changing an approval.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 (Products): Source's read model for artifact metadata. Layer 3 artifact records, stored data, hashes and approval policy are unchanged.

## Client Applicability

- All clients: Source artifact metadata reads that encounter Date-shaped acceptance timestamps.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Convert a valid Date-shaped accepted-at value to an ISO string at the file-cabinet mapping boundary.
- Preserve existing string values and reject invalid Date objects as missing.
- Add repository regression coverage for both shapes.
- No migration, data build, new approval or external notification.

## QA / Validation

- Red-first repository test: Pass; a valid Date mapped to null before the fix.
- Practical mutation: Pass; restoring the string-only mapper made the new test fail.
- Repository, accepted-final helper and restoration route suites: Pass (3 suites, 27 tests).
- Typecheck: Pass (`npx tsc --noEmit --pretty false`).
- Targeted ESLint: Pass.
- Release checks: Pass.
- CI and signed-in replay: Not run at candidate creation; record separately before live acceptance claims.

## Rollout Plan

Squash merge after applicable checks and review, then allow only the repository-owned ACA main workflow to deploy. Verify the immutable serving digest and worker images before replaying the exact signed-in accepted-final restoration and downstream artifact step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this change.
- Approved image digest: To be established by the main deploy workflow.
- ACA runtime invariant: Verify web template and 100%-traffic revision use the approved digest.
- Worker image invariant: Verify required workers use the same approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the squash merge through a PR and let the repository-owned main workflow redeploy. No schema or data rollback is required.

## Audit Evidence

PR diff, repository regression and mutation result, applicable CI, official ACA run, read-only runtime proof, and signed-in restoration and retry record.

## Known Gaps

Live restoration and downstream generation remain unproven until the deployed signed-in replay. Other evidence and stage prerequisites remain governed independently.
