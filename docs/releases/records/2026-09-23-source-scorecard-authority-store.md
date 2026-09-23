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
- Mount the read through an authenticated event-scoped route and the Stage 07 workspace; no ranking, BAFO, award, or score write is enabled.

## QA / Validation

- Red-first tests proved missing read implementation, missing current-row filters, and database decimal handling before their fixes.
- Removing the score event-identity check made the opposite-event test fail; restoring it made the test pass.
- A red-first schema check caught SQL three-valued logic accepting an approved criterion row with a null approved version; the authored constraint now requires a non-null approved version. This is a source-level check, not a database migration execution.
- Red-first route and workspace tests caught the missing product path. Removing the workspace event-identity guard made the opposite-event test fail; the guard was restored.
- A red-first rendered test caught draft criteria counted as approved; the Stage 07 counts now include only named, version-matched approvals and their frozen weights.
- Focused Jest, scoped ESLint and TypeScript were run locally. No shared migration apply or data-plane readback was performed.

## Rollout Plan

This remains a draft until schema and read-contract review, applicable CI, and an authorized migration plan. The mounted Stage 07 view fails closed while the schema is unapplied. Positive signed-in behavior on a legitimately advanced event remains owed.

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
