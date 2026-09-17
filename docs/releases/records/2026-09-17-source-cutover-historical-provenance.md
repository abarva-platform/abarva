# 2026-09-17-source-cutover-historical-provenance - Preserve source snapshots during cutover

## Release ID

`2026-09-17-source-cutover-historical-provenance`

## Status

`candidate`

## Plain-English Summary

The governed opportunity cutover may retain historical adapter rows and their matching source snapshots. These are source provenance, not live opportunity decisions. The job validates their exact package, contract, record IDs, source hashes, and payload parity, includes their combined hash in the operator approval, and still blocks all other external references. This release does not run a cutover.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 2 adapter and Layer 3 source snapshot rows are read and preserved; no loader or schema change.
- Layer 3 opportunity retirement remains controlled by the existing operator job.
- Layer 4 product projections are unchanged.

## Client Applicability

- All clients: the operator job may handle manifest-declared evidence-only packages with matching source provenance.
- Specific clients: only an exact tuple selected by the ownership manifest can be planned or applied.
- Internal only: operator job and proof bundle.
- Public/demo only: none.
- Feature flag: none; apply still requires exact IDs, hashes, and approval.

## Changes Included

- `scripts/source/opportunity-ownership-cutover-job.mjs`: exact historical-provenance validation and hash gating.
- Focused unit and disposable PostgreSQL integration tests.
- This release record.

## QA / Validation

- PASS: nine focused tests, including tampered snapshot and changed post-plan provenance rejection.
- PASS: scoped lint, syntax, TypeScript, release check, and diff check before PR.
- NOT RUN: Azure operator job plan/apply, Blob proof, Layer 4 reconciliation, or signed-in product proof.

## Rollout Plan

Deploy only through the repository-owned ACA workflow, then rerun the read-only operator plan against the deployed digest. Review exact provenance row count/hash alongside the opportunity inventory before any separate apply. Preserve the source rows and snapshots throughout retirement and verify.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this candidate.
- Approved image digest and ACA runtime invariant: required after deployment.
- Worker image invariant: required before operator execution.
- Live signed-in proof required: yes, after the data and projection cutover.

## Rollback Plan

Revert this operator code before an apply if its provenance rule is wrong. After an apply, use the existing exact archive restore path with the same provenance hash, then roll back the code through the governed release process. No historical source rows are deleted by this change.

## Audit Evidence

The plan and apply proof include the historical provenance row count and SHA-256. The archive proof and operator execution record remain mandatory. The dedicated Blob proof target is private and authenticated through the job's pinned user-assigned identity.

## Known Gaps

This narrow allowance covers only a validated opportunity adapter row paired with its exact source snapshot. It intentionally does not permit other JSON references or authorizations. A successful local rehearsal is not live proof.
