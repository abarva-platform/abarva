# 2026-08-01-source-to-consumption-coverage-gate — Block sparse-publication false positives

## Release ID

`2026-08-01-source-to-consumption-coverage-gate`

## Status

`candidate`

## Plain-English Summary

This release tightens the Foundation V2 reconciliation job so it cannot pass just because accepted canonical counts and consumption counts both happen to be zero. The evaluator now checks source-domain coverage against downstream consumption projections. If application source rows exist and the application consumption projection is empty, reconciliation fails with a source-to-consumption blocker.

It also adds the first exploration evidence contract for application and interview source families. Valid parsed rows, fields, and retrieval chunks can now be loaded into evidence-layer tables and projected into exploration consumption tables without pretending that every row is canonical truth.

This preserves the distinction between sparse accepted publication, full source exploration, generated synthesis, and complete data integration certification.

## Layer Impact

Client-data-lane: strengthens reconciliation for source, candidate, canonical, evidence, and consumption layers. It does not change source data or promote any candidate.

Internal-admin: updates the job executor and tests used by isolated Foundation V2 execution lanes.

## Client Applicability

- All clients: Yes, for Foundation V2 job-runner reconciliation behavior.
- Specific clients: Existing skyharbor-air evidence is corrected as sparse accepted-publication proof only.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/processing/executor-framework.mjs`: adds source-domain coverage readback and per-domain source-to-consumption reconciliation.
- `scripts/knowledge/processing/process-handlers.mjs`: makes source-to-consumption unpublished domains block the reconciliation job.
- `scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`: adds regression tests for the false-positive application case and the valid published case.
- `clients/skyharbor-air/execution/skyharbor-air-foundation-v2-gates-3-7-db-proof-2026-07-31.md`: adds a correction clarifying that the prior evidence does not prove full application parity or load completeness.
- `supabase/migrations/20260801020000_foundation_exploration_evidence_contract.sql`: adds evidence-layer source row, field, chunk, and disposition tables plus application/interview/generated-synthesis exploration projections with explicit tenant RLS.
- `scripts/knowledge/backfill-exploration-evidence.mjs`: adds deterministic dry-run/apply support for application and interview exploration evidence.
- `scripts/knowledge/__tests__/run-exploration-evidence-backfill-tests.mjs`: adds dry-run volumetric assertions for application and interview exploration loads.

## QA / Validation

- Pass: `node scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`
- Pass: `node scripts/knowledge/__tests__/run-exploration-evidence-backfill-tests.mjs`
- Pass: `node scripts/knowledge/backfill-exploration-evidence.mjs --tenant skyharbor-air`
- Pass: `git diff --check`
- Pass: SQL contract marker check for expected tables and RLS statements.
- Pass: throwaway local Postgres apply of `20260729015000_knowledge_publication_consumption_phase3c2e.sql` followed by `20260801020000_foundation_exploration_evidence_contract.sql`; 7 expected evidence/consumption exploration tables present.

Dry-run volumetrics for the application/interview slice:

- source rows: 1,489
- source fields: 36,317
- non-empty source fields: 34,912
- source chunks: 1,489
- disposition ledger rows: 37,806
- application exploration rows: 503
- interview exploration rows: 986
- unexplained dry-run variance: 0

## Rollout Plan

Merge through the protected PR path. Apply the additive schema migration through the governed database migration path for the isolated tenant boundary. Then run the exploration backfill in dry-run mode, review the volumetrics, run apply mode through the isolated job path, and independently read back evidence and consumption exploration counts before claiming exploration-load proof.

The repo-owned ACA main deploy workflow can publish the updated job-runner image for stricter reconciliation. After deployment, rerun the affected reconciliation job before claiming any Foundation V2 data-load certification.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None from local commands in this release.
- Approved image digest: Assigned by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deploy before using the new image as proof.
- Worker image invariant: Required for the affected job image before rerun evidence is accepted.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after DB and consumption gates pass.

## Rollback Plan

Revert this release. If deployed, roll forward through the repo-owned ACA workflow with the revert commit. Do not edit reconciliation ledger rows in place; supersede with a governed rerun.

## Audit Evidence

- Local test output: `node scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`
- Local test output: `node scripts/knowledge/__tests__/run-exploration-evidence-backfill-tests.mjs`
- Local dry-run output: `node scripts/knowledge/backfill-exploration-evidence.mjs --tenant skyharbor-air`
- Corrected evidence record: `clients/skyharbor-air/execution/skyharbor-air-foundation-v2-gates-3-7-db-proof-2026-07-31.md`

## Known Gaps

- This change prevents future false-positive reconciliation, but it does not itself republish missing application consumption rows.
- The local dry-run does not mutate Azure/Postgres. A governed schema apply plus isolated backfill job is required for database-backed proof.
- Generated synthesis storage is defined, but deterministic local backfill does not create Claude-generated rows. Those require a separate grounded generation job with source citations.
- A rerun is required to produce fresh failed/passed DB evidence under the stricter gate.
