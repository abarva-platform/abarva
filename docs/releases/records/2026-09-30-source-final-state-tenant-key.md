# 2026-09-30-source-final-state-tenant-key — Accepted Final Restoration Lookup

## Release ID

`2026-09-30-source-final-state-tenant-key`

## Status

`candidate`

## Plain-English Summary

The Source restoration action can find an event's artifact state when the event's client key differs from the canonical file-storage tenant key. It still verifies the accepted final against its immutable file hash before updating the working link.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 (Products): one Source artifact workflow lookup. Layer 3 canonical records, artifact authority, approval policy and stored schema are unchanged.

## Client Applicability

- All clients: The Source restoration route uses the event client key for its canvas-state lookup.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Query the event-scoped canvas artifact state with its app client key.
- Keep canonical tenant-key resolution for the accepted-final registry and blob verification.
- Exercise distinct-key and wrong-tenant behavior in the route tests.
- No migration, data build or external notification.

## QA / Validation

- Red-first route suite: Pass; the distinct-key fixture returned `artifact_state_not_found` before the fix.
- Practical mutation: Pass; reversing the lookup to the storage key reproduced the four failing route cases.
- Adjacent route and contract suites: Pass (3 suites, 29 tests), including wrong-tenant, missing authority, hash mismatch and idempotency negatives.
- Typecheck: Pass (`npx tsc --noEmit --pretty false`).
- Targeted ESLint: Pass.
- Release checks: Pass.
- CI and signed-in replay: Not run at candidate creation; record separately before live acceptance claims.

## Rollout Plan

Squash merge after applicable checks and review. Only the repository-owned ACA main workflow may deploy the change to the shared runtime. Verify the immutable serving digest and worker images, then repeat the exact signed-in restoration and downstream generation attempt.

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

PR diff, route tests and mutation result, applicable CI, official ACA run, read-only runtime check, and signed-in restoration/retry record.

## Known Gaps

Live restoration and downstream artifact generation remain unproven until the deployed signed-in replay. Unrelated evidence and stage prerequisites remain governed independently.
