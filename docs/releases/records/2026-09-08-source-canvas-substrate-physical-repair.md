# Source Canvas Physical Substrate Repair

## Release ID

`2026-09-08-source-canvas-substrate-physical-repair`

## Status

`candidate`

## Plain-English Summary

An additive database repair restores Source event artifact, gate-criterion,
and evidence-state tables when migration history says the original canvas
migration ran but the physical database no longer contains the expected
objects. The migration preserves existing rows and restores the final columns,
indexes, update triggers, access policies, and grants expected by Source.

The database migration workflow now proves the repaired substrate through the
same Azure read and write adapters used by the product. Its synthetic fixture
is removed in the same transaction and never becomes client data.

## Layer Impact

- **Lane:** `client-data-lane`
- **Layer 3, Canonical model:** Restores mutable, tenant-scoped Source event state tables and their access controls.
- **Layer 4, Products:** Adds a governed repository readback to the database migration workflow; no Source UI behavior changes.

## Client Applicability

- All clients: Yes, for Source event canvas persistence.
- Specific clients: None.
- Internal only: The migration operator and repository verification are internal controls.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Additive, idempotent physical repair migration for `source_event_artifact_states`, `source_event_gate_criterion_states`, and `source_event_evidence_states`.
- Final artifact body and generation-metadata columns are included in the repaired table shape.
- Azure repository readback exercises artifact write/read, gate-state read, and evidence-state read through production adapters.
- `db-migration-lab.yml` runs that repository readback after an apply.

## QA / Validation

- PASS: migration status preflight proved the original migration was recorded as applied while live artifact generation reported a missing physical relation.
- PASS: scoped ESLint and TypeScript validation for the repository readback.
- PASS: disposable Postgres apply and repeat-apply; 3 tables, 19 final artifact columns, 12 tenant policies, and 3 update triggers read back.
- PASS: Azure adapter repository verification against disposable Postgres; artifact body and metadata round-tripped and the fixture was removed before commit.
- PASS: release control check.
- PENDING: governed migration apply, repository readback, health check, and audit-chain evidence.
- PENDING: signed-in Source artifact generation and persisted draft proof.

## Rollout Plan

Squash-merge by pull request, deploy the exact merge SHA through the repo-owned
ACA main workflow, and dispatch `db-migration-lab.yml` with explicit
`mode=apply` and `confirm=APPLY`. Require schema readback, repository readback,
application health, and audit-chain output before retrying signed-in generation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: `.github/workflows/db-migration-lab.yml` for the additive schema apply only.
- Approved image digest: Pending ACA main deploy output.
- ACA runtime invariant: Must pass before migration apply.
- Worker image invariant: Must match the approved web digest where enforced by the main deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

The migration restores objects required by the deployed product and does not
rewrite tenant rows. If application behavior regresses, revert the application
release and redeploy the prior digest. Do not drop repaired tables; use a
follow-up additive migration after inspecting any rows written after rollout.

## Audit Evidence

- Pull request validation and migration diff.
- ACA deployment run, merge SHA, revision, digest, and runtime-invariant artifact.
- Database migration run artifact with schema/repository readbacks and audit chain.
- Signed-in Source event generation and persisted artifact proof.

## Known Gaps

- The repair does not backfill every historical Source event. Runtime scaffold repair remains responsible for idempotently materializing canonical rows when an event is opened or generated.
