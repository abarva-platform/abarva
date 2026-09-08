# Source Artifact Substrate Physical Repair

## Release ID

`2026-09-08-source-artifact-substrate-physical-repair`

## Status

`candidate`

## Plain-English Summary

An additive database repair restores the server-managed tables that turn an
uploaded Source document into parsed chunks, structured facts, requirements,
commercial evidence, graph links, and persisted reasoning records. A new
read-only repository check prevents migration history from masking missing
physical tables again.

## Layer Impact

- **Lane:** `client-data-lane`
- **Layer 3, Canonical model:** Restores parsed evidence, lineage, and reasoning records.
- **Layer 4, Products:** Restores the existing Source upload and grounded-generation paths; no presentation redesign.

## Client Applicability

- All clients: Yes, where Source document upload and generated insights are enabled.
- Specific clients: None.
- Internal only: The migration operator and schema readback are internal controls.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Recreate the final parsed-evidence tables from the existing Source artifact-registry contract when physically absent.
- Recreate durable Source reasoning-envelope persistence when physically absent.
- Reapply tenant-scoped read policies and server-role write policies.
- Add a read-only schema contract check to the governed database migration workflow.
- Preserve structured database error details in upload parse warnings and logs.

## QA / Validation

- PASS: disposable Postgres apply, repeat-apply, and read-only 10-table/64-column schema contract.
- PASS: focused upload-route tests (6), scoped ESLint, TypeScript no-emit, release control, and diff checks.
- PASS: local DOCX extraction for five rich managed-services documents (no extraction warnings).
- PENDING: exact-SHA ACA deploy and governed migration apply.
- PENDING: signed-in document re-upload with chunk/fact readback and grounded artifact regeneration.

## Rollout Plan

Squash-merge by pull request, deploy the exact merge SHA through the repo-owned
ACA main workflow, then dispatch the governed database migration workflow with
explicit apply confirmation. Require schema readback, health, audit-chain, and
signed-in upload proof before treating document content as model-ready.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutator: `.github/workflows/db-migration-lab.yml`
- Approved image digest: Pending.
- ACA runtime invariant: Required.
- Live signed-in proof required: Yes.

## Rollback Plan

The migration is additive and preserves existing rows. If application behavior
regresses, revert the application release and deploy the prior digest. Do not
drop evidence-bearing tables; make any schema correction with a follow-up
additive migration after inspecting rows written after rollout.

## Audit Evidence

- Pull request validation and migration diff.
- ACA deployment run with merge SHA, revision, digest, and worker invariant.
- Database migration run with schema readback and audit chain.
- Signed-in upload response plus parsed chunk/fact and regenerated-artifact proof.

## Known Gaps

- Existing registry rows that previously failed parsing must be re-uploaded or
  reparsed after the repair; this migration does not infer content from stored bytes.
