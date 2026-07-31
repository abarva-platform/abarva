# 2026-07-31-knowledge-projection-proof-readback — Projection Proof Readback Hardening

## Release ID

`2026-07-31-knowledge-projection-proof-readback`

## Status

`candidate`

## Plain-English Summary

Hardens governed Knowledge proof scripts so projection success requires reader-visible consumption rows and active `publication.projection_version` authority, not a partial runtime proof or a job self-report alone.

## Layer Impact

Release lane: `internal-admin`.

Layer 4 Products: proof scripts now inspect the full Home Knowledge consumption projection set and projection authority rows.

Operations and audit: the live reconciliation readback now records permission-denied relations as explicit evidence rows instead of aborting before projection proof can complete.

## Client Applicability

All clients: no product runtime behavior changes.

Specific clients: applies to governed foundation-preview proof execution for the current lab tenant.

Internal only: data-plane QA, proof, and release evidence scripts.

Public/demo only: none.

Feature flag: none.

## Changes Included

- `scripts/qa/airline-e2e-live-reconciliation-readback.mjs`
- `scripts/qa/airline-module-runtime-db-proof.mjs`
- `scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`

## QA / Validation

- `node --check scripts/qa/airline-e2e-live-reconciliation-readback.mjs` — passed.
- `node --check scripts/qa/airline-module-runtime-db-proof.mjs` — passed.
- `node --check scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs` — passed.
- `node scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs` — passed.

## Rollout Plan

Merge through normal PR review. The scripts become active the next time an approved ACA data-build or proof job uses an image built from the merged SHA.

## Deployment Authority

- Repo-owned deploy workflow: required before using the updated scripts in shared ACA jobs.
- Shared runtime mutators: none in this change.
- Approved image digest: determined by the repo-owned deploy workflow.
- ACA runtime invariant: unchanged.
- Worker image invariant: proof jobs must use a digest-pinned image.
- Feature/env flag update path: none.
- Live signed-in proof required: no, this is proof-script hardening only.

## Rollback Plan

Revert this PR. Existing data and product runtime are unchanged.

## Audit Evidence

- PR for this release record.
- Local command output from the QA / Validation section.
- ACA proof logs from governed projection and read-model jobs should be attached to the operating proof bundle, not this public release record.

## Known Gaps

This change does not run the full product UI proof, aVa grounding proof, Cube parity, or a new data reload.
