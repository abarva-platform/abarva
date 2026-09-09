# Source approval actor resolution

## Release ID

`2026-09-09-source-approval-actor-resolution`

## Status

`candidate`

## Plain-English Summary

Resolve Source approval-ledger actors from the canonical person record before using the legacy Clerk identifier fallback. This prevents a valid internal person UUID from rendering as an unknown approver.

## Layer Impact

- Layer 4 product projection, `global-control-lane`: Source approval-ledger display only.
- No intake, adapter, canonical data, schema, cube, corpus, or tenant-data mutation.

## Client Applicability

All clients whose Source approval records store canonical person IDs. Tenant and event access remain enforced before the ledger is rendered.

## Changes Included

- Resolve UUID actor IDs through `persons.id` and use the stored name or email.
- Preserve Clerk lookup for legacy Clerk identifiers, including the `clerk:` prefix form.
- Focused loader coverage proving UUIDs are not sent to Clerk.

## QA / Validation

- Focused approval-ledger loader tests.
- Scoped ESLint and full TypeScript checks.
- `npm run release:check` and `git diff --check`.
- Live signed-in completed-event ledger proof required after deployment.

## Rollout Plan

Merge through a squash PR and deploy through the repo-owned ACA main workflow. Verify the completed event ledger displays the authenticated approver name while preserving all stage approvals.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repo-owned main deploy workflow only.
- Approved image digest: recorded after deployment.
- ACA runtime invariant: template image, active revision, and worker images must match.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR. Approval records and lifecycle state are unchanged.

## Audit Evidence

- Focused test output, PR, merge SHA, ACA deploy run, runtime invariant, and signed-in ledger proof.

## Known Gaps

Historical approval rows without any actor identifier remain honestly labeled as not recorded.
