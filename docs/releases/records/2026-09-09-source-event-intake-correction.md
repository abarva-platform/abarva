# 2026-09-09-source-event-intake-correction — Governed Source Intake Corrections

## Release ID

`2026-09-09-source-event-intake-correction`

## Status

`candidate`

## Plain-English Summary

Source administrators can correct a persisted sourcing-event intake record when later evidence
shows that an entered trigger, scope, owner, or candidate value is wrong. The correction requires
an explicit confirmation and reason, is restricted to the active tenant, and writes an audit entry.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 — Canonical model: corrects whitelisted fields on the governed `source_events` record.
- Layer 4 — Source: adds an authenticated API operation for the correction workflow.

## Client Applicability

- All clients: yes, subject to existing Source stage-approval authorization.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `PATCH /api/v1/source/events/:eventId` for confirmed, reasoned intake corrections.
- Adds Azure and compatibility write-adapter support for tenant-scoped event-intake updates.
- Adds route, authorization, tenant-isolation, and adapter tests.

## QA / Validation

- PASS — `npx jest --runInBand --runTestsByPath src/lib/data-plane/write-adapters/__tests__/source-write-adapter.test.ts src/app/api/v1/source/events/[eventId]/__tests__/route.test.ts`
- PASS — `npx tsc --noEmit --pretty false`
- PASS — `npx eslint` on all touched TypeScript files.
- PASS — `git diff --check`

## Rollout Plan

Merge by pull request. The repository-owned ACA main deploy workflow builds and deploys the exact
merge SHA. After deployment, perform one authorized correction and verify the event readback and
activity audit record before relying on the corrected intake in generated artifacts.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repository-owned workflow only.
- Approved image digest: recorded by the deploy workflow.
- ACA runtime invariant: template, active revision, and 100% traffic revision must use that digest.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the pull request and redeploy through the repository-owned workflow. Existing corrections
remain in the audit trail; an authorized operator can submit a new correction restoring the prior
governed values if required.

## Audit Evidence

- Pull request and squash-merge SHA.
- Focused Jest, TypeScript, ESLint, and release-check output.
- ACA deploy run and digest-pinned runtime readback.
- Signed-in correction response, event readback, and activity-log readback.

## Known Gaps

No editing form is added in this release; the governed API is the operator path.
