# 2026-09-27-source-event-approval-policy-schema - Event approval policy storage

## Release ID

`2026-09-27-source-event-approval-policy-schema`

## Status

`candidate`

## Plain-English Summary

Source events gain an explicit approval-policy value. Existing events retain the signed-scope policy by default. A database guard prevents later changes to an event's policy; the application behavior does not change in this release.

## Layer Impact

Release lane: `client-data-lane`. Layer 4 Source workflow authority metadata only. No supplier, price, contract, finance, or other canonical Layer 3 fact is changed.

## Client Applicability

- All clients: additive column on the shared Source event table once the governed migration is applied.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

One additive Source event schema migration with a legacy default, value constraint, and policy-immutability trigger. No application route changes.

## QA / Validation

- Pass: migration reviewed against the existing `source_events` table, unique event key, and official migration workflow.
- Pass: application policy tests cover explicit SELF, missing/historical legacy, and invalid values on the dependent code branch.
- Not run: database migration apply and live schema readback; these require separate specific authorization.
- Not run: live Source decision; this release does not change the application.

## Rollout Plan

Squash merge this schema-only PR first. The repo-owned ACA main workflow may redeploy unchanged application code. Use the governed `db-migration-lab.yml` preflight to inspect the pending set. Apply this migration only after separate specific authorization and confirm the migration ledger plus a read-only column/constraint/trigger readback. Only then may the dependent Source SELF-policy code PR merge and deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge.
- Shared runtime mutators: That workflow only.
- Approved image digest: Determine from the completed main workflow.
- ACA runtime invariant: Verify template and healthy 100%-traffic revision match the digest.
- Worker image invariant: Verify required delivery workers match the digest.
- Feature/env flag update path: None.
- Live signed-in proof required: After the dependent code release, not from this schema-only PR.

## Rollback Plan

Before apply, revert the migration file via a PR. After apply, do not drop the column while any code depends on it; first roll back the dependent application release through a PR and official deploy, then use a separately authorized additive-compatible schema remediation.

## Audit Evidence

The schema PR, CI checks, official migration preflight/apply runs when authorized, migration ledger, read-only schema inspection, and official ACA runtime proof are separate evidence layers.

## Known Gaps

Migration apply and positive schema readback are blocked pending separate specific authorization. The dependent SELF-policy application behavior is a separate PR and is not live from this release.
