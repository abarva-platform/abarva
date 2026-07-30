# 2026-07-30-airline-relationship-field-lineage — Airline Relationship Field Lineage

## Release ID

`2026-07-30-airline-relationship-field-lineage`

## Status

`candidate`

## Plain-English Summary

Preserves and verifies source-field lineage for accepted relationship records. Relationship rows can now carry the original evidence-backed source-row payload into canonical relationship publication, and the read-only reconciliation verifier can account for fields preserved in relationship payloads or live evidence instead of reporting them as lost because they are not fact fields. The projection authority gate now compares the active core projection authority row against the current live projection table counts rather than an obsolete single stored hash.

## Layer Impact

- `client-data-lane`: Updates the governed Airline proof lane and shared Knowledge publication executor. It affects accepted relationship publication payloads and read-only lineage verification only; it does not approve new facts, replay review decisions, or switch product providers.
- Layer 3 canonical model: accepted relationship publication carries evidence-backed source-row payload for field-lineage auditability.
- Layer 4 products: no direct UI change in this PR.

## Client Applicability

- All clients: No.
- Specific clients: Airline governed proof lane, plus future tenants using the shared Knowledge publication executor.
- Internal only: Yes, publication/reconciliation mechanics.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/processing/executor-framework.mjs`
- `scripts/qa/airline-e2e-live-reconciliation-readback.mjs`
- `scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`

## QA / Validation

- Pass: `node --check scripts/qa/airline-e2e-live-reconciliation-readback.mjs`
- Pass: `node --check scripts/knowledge/processing/executor-framework.mjs`
- Pass: `node scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`
- Pass: local no-DB readback smoke for verifier syntax/manifest behavior.
- Pending: CI, deploy, affected downstream rebuild, and VNet readback after merge.

## Rollout Plan

Merge to `main` through PR and deploy through the repo-owned ACA main deploy workflow. After deployment, rerun the governed publication/projection job for the affected relationship lineage path, then rerun the Airline VNet reconciliation job. Do not certify the corpus until VNet readback and Cube parity pass.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the deploy workflow.
- Approved image digest: pending deployment.
- ACA runtime invariant: pending deployment.
- Worker image invariant: pending deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: no, VNet readback and downstream parity proof required.

## Rollback Plan

Revert this change and redeploy the prior image if relationship publication or reconciliation regresses. If affected downstream publication/projection jobs have run, restore from the prior governed baseline/projection run rather than replaying review decisions.

## Audit Evidence

- PR, CI checks, deployed revision/digest, affected rebuild job logs, and VNet reconciliation proof after merge.

## Known Gaps

- This does not ingest offline augmentation.
- This does not replay review decisions.
- The existing live corpus remains uncertified until all variance gates close and Cube parity passes.
