# 2026-07-30-airline-source-landing-idempotency-fk — Source Landing Idempotency FK Repair

## Release ID

`2026-07-30-airline-source-landing-idempotency-fk`

## Status

`candidate`

## Plain-English Summary

Repairs the governed source landing retry path so reruns that reuse the same idempotency key attach source rows to the effective run ledger row returned by the database.

## Layer Impact

client-data-lane: affects source landing run-ledger registration and source/source-version lineage references. It does not change product UI behavior, canonical records, publications, baselines, projections, Cube output, or provider routing.

## Client Applicability

- All clients: No.
- Specific clients: Demo Airline source landing execution path only.
- Internal only: Operator/runtime data job behavior.
- Public/demo only: Demo Airline lab execution.
- Feature flag: None.

## Changes Included

- Source landing now reads the effective `operations.run.run_ref` returned after insert-or-idempotent-update.
- Source registry rows, source version rows, checkpoints, final run updates, and failure updates use that effective run ref.
- Regression coverage asserts the retry-safe effective-run-ref contract.

## QA / Validation

- PASS: `node scripts/knowledge/__tests__/run-airline-source-landing-tests.mjs`
- PASS: `node --check scripts/knowledge/land-airline-source-corpus.mjs`
- PASS: `npm run release:check`

## Rollout Plan

Merge through the protected PR path and deploy through the repo-owned ACA main deploy workflow. Rerun the governed ACA source landing job only after the new digest is live and captured.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be produced by the repo-owned ACA main deploy workflow after merge.
- ACA runtime invariant: Required before rerun of source landing.
- Worker image invariant: Source landing rerun must use the approved digest as an execution override or updated job image.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this source landing repair; product proof remains required at later Home/aVa gates.

## Rollback Plan

Revert the source landing retry change and redeploy the prior ACA digest. If rollback is needed after a failed landing attempt, rerun source landing only after confirming the run ledger/source registry FK state.

## Audit Evidence

- Failed J1 rerun execution: `job-airdn-source-register-lab-b0c5vac`
- Failure code: PostgreSQL `23503`
- Failure constraint: `source_tenant_key_registered_run_ref_fkey`
- Follow-up source landing rerun must provide execution ID, image digest, Blob URIs, hashes, source landing totals, and reconciliation status.

## Known Gaps

This release only fixes the source landing idempotent rerun/FK transition. It does not certify J1 landing, downstream processing, publications, baselines, projections, Cube parity, Home Knowledge, or aVa behavior.
