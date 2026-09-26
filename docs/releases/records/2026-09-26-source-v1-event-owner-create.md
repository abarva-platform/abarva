# Source event creator ownership

## Release ID

`2026-09-26-source-v1-event-owner-create`

## Status

`candidate`

## Plain-English Summary

When a named user creates a Source event, that user is assigned the Event Owner decision role for that event. The API and agent creation paths use the same participant write. A missing identity or failed owner assignment is reported as a failed creation response, not a successful one. Existing evidence and release gates are unchanged.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: Existing event-person participation rows receive owner authority flags; no new object, migration, or supplier/commercial fact is introduced.
- Layer 4 Source: Creation responses describe the default Event Owner authority without promising that evidence gates are complete.

## Client Applicability

- All clients: Source event creation paths that use the existing participant store.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- API and agent event creation use the tenant-selected participant writer.
- Both physical adapter implementations assign the named creator as Event Owner, with event-scoped stage, award-decision, and publication authority but no new financial visibility.
- Missing participant storage fails the assignment instead of returning success; the Azure duplicate participant insert remains a no-op.
- Creation text reflects Event Owner authority while preserving governed evidence requirements.

## QA / Validation

- Pass: Red-first tests captured the previous contributor assignment and the agent's bypass of the shared adapter.
- Pass: API, adapter, and agent creation suites (52 tests); focused event-scope authorization regression.
- Pass: Deliberately dropping the stage-approval flag in each physical adapter fails the respective test; mutations were restored.
- Pass: ESLint on changed TypeScript files, `tsc --noEmit`, and `release:check`.
- Blocked: Four unchanged admin-fixture expectations in the full Source access-policy suite fail on the base branch; the new owner-isolation test passes. These are not represented as green.
- Not run: Live signed-in creation and participant readback pending deployment and an authorized synthetic test fixture.

## Rollout Plan

Squash merge through the protected main branch. Only the repository-owned ACA main workflow builds and deploys the image. Do not apply migrations or mutate existing events as part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Not run; resolve after official deployment.
- ACA runtime invariant: Not run; verify digest-pinned web template, 100% traffic revision, and required workers after deployment.
- Worker image invariant: Not run.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes; verify new-event owner readback and existing governed gate behavior separately.

## Rollback Plan

Revert the merged code through a new PR and let the repository-owned main workflow deploy the replacement digest. Existing participant rows are not automatically rewritten by code rollback; investigate any owner assignments made during the release before a data correction.

## Audit Evidence

- PR, CI, deployment run, immutable image digest, and signed-in readback: Not run at candidate stage.
- Focused test output and mutation failures are available in the implementation task record.

## Known Gaps

- Existing events are not backfilled or implicitly promoted to Event Owner.
- Event Owner assignment does not satisfy a separate evidence or signature requirement on an existing event.
- A participant write failure can occur after the event row is created; the route returns failure, but transactional compensation is not added here.
