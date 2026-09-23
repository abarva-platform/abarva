# 2026-09-23-source-scorecard-authority-store — Scorecard Authority Read Candidate

## Release ID

`2026-09-23-source-scorecard-authority-store`

## Status

`candidate`

## Plain-English Summary

Adds a tenant- and event-bound read contract for scorecard criteria and evaluator scores, with an authored but unapplied schema. The Stage 07 workspace can request that authority through a read-only, authenticated route. Missing schema, malformed rows, and mismatched ownership fail closed.

## Layer Impact

Release lane: `client-data-lane`. The proposed Layer 3 tables hold versioned criterion and score authority. The Source read adapter projects their current rows; it does not infer approval from navigation or generated content.

## Client Applicability

- All clients: The read contract is available once the schema is separately reviewed and applied.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Author criterion and score tables with event/tenant keys, version and lock constraints, and tenant-read RLS.
- Read current rows only and recheck tenant/event identity after the database query.
- Distinguish no rows from unavailable schema and normalize finite database decimal values.
- Normalize driver-returned timestamp objects into stable ISO readback values.
- Mount the read through an authenticated event-scoped route and the Stage 07 workspace; no ranking, BAFO, award, or score write is enabled.
- Resolve the event through the tenant-bound Source access policy before querying scorecard records.

## QA / Validation

- Red-first tests proved missing read implementation, missing current-row filters, and database decimal handling before their fixes.
- Removing the score event-identity check made the opposite-event test fail; restoring it made the test pass.
- A red-first schema check caught SQL three-valued logic accepting an approved criterion row with a null approved version; the authored constraint now requires a non-null approved version. This is a source-level check, not a database migration execution.
- Red-first route and workspace tests caught the missing product path. Removing the workspace event-identity guard made the opposite-event test fail; the guard was restored.
- A red-first rendered test caught draft criteria counted as approved; the Stage 07 counts now include only named, version-matched approvals and their frozen weights.
- A driver-shaped test failed first when Postgres timestamp columns arrived as `Date` objects; approved and locked timestamps now normalize to ISO text for the authority view.
- A route test failed first when the route used the general event lookup; the route now requires the tenant-resolved, policy-enforcing lookup and passes the authenticated actor context.
- Focused Jest, scoped ESLint and TypeScript were run locally. No shared migration apply or data-plane readback was performed.

## Rollout Plan

The code-only release may merge after review and applicable CI. The repo-owned ACA workflow does not apply database migrations; the authored schema must be reviewed and applied through a separately authorized database workflow. Until then, the mounted Stage 07 view reports authority unavailable and remains fail closed. No writer is enabled, and positive data-plane readback and signed-in behavior on a legitimately advanced event remain owed. Do not treat the code deployment as permission to advance evaluation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after a reviewed merge.
- Shared runtime mutators: None from this branch.
- Approved image digest: Owed after deployment.
- ACA runtime invariant: Owed after deployment.
- Worker image invariant: Owed after deployment.
- Live signed-in proof required: Yes, after the authority is mounted and the schema is applied.

## Rollback Plan

Before schema apply, revert the code-only PR through the repo-owned workflow. After an authorized apply, disable the reader consumer before any schema rollback; preserve historical evaluation records and use a separately reviewed migration for database changes.

## Audit Evidence

The reviewed PR, red/green tests, mutation run, later migration-apply proof, runtime digest, data readback and signed-in acceptance must be recorded separately.

## Known Gaps

There is no writer, approved criterion-version transition, shared schema apply, or positive scorecard readback yet. This is a D-020 foundation, not D-020 acceptance or permission to rank, advance, send BAFO, or award.
