# 2026-09-30-source-upstream-date-shape — Accepted Final Upstream Readback

## Release ID

`2026-09-30-source-upstream-date-shape`

## Status

`candidate`

## Plain-English Summary

Source generation recognizes a previously accepted, current final as required upstream context when Postgres returns its acceptance timestamp as a Date. An invalid timestamp still does not satisfy the requirement.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 (Products): Source's upstream generation guard. Layer 3 artifact records, approval policy and stored data are unchanged.

## Client Applicability

- All clients: Source generation that depends on an accepted upstream final.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Accept a valid Date-shaped or nonblank string acceptance timestamp in the existing authority check.
- Reject invalid Date objects and blank strings; retain current-authority, stage and acceptance-actor requirements.
- Add focused regression coverage for both Date outcomes and blank timestamps.
- No migration, data build, new approval or external notification.

## QA / Validation

- Red-first regression: Pass; valid and invalid Date values both threw before the fix.
- Practical mutations: Pass; removing Date acceptance failed the valid-Date test, and accepting any Date failed the invalid-Date test.
- Upstream and authority suites: Pass (2 suites, 34 tests).
- Two adjacent generation route suites: Pass (2 suites, 10 tests).
- Typecheck: Pass (`tsc --noEmit --pretty false`).
- Targeted ESLint: Pass.
- Release checks: Pass.
- CI and signed-in replay: Not run at candidate creation; record separately before live acceptance claims.

## Rollout Plan

Squash merge after applicable checks and review, then allow only the repository-owned ACA main workflow to deploy. Verify the immutable serving digest and worker images before replaying the exact signed-in generation step.

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

PR diff, regression and mutation results, applicable CI, official ACA run, read-only runtime proof, and signed-in generation retry record.

## Known Gaps

Downstream generation is unproven until deployed signed-in replay. Other Scope evidence and stage prerequisites remain governed independently.
