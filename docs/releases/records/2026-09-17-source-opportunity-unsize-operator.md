# 2026-09-17-source-opportunity-unsize-operator - Governed in-place opportunity unsizing

## Release ID

`2026-09-17-source-opportunity-unsize-operator`

## Status

`candidate`

## Plain-English Summary

Adds a private operator job to remove unsupported candidate amounts from one explicitly declared canonical writer set while retaining opportunity identities and all supporting evidence, cases, and claims. Plan reports exact scope and row hashes. Apply requires those hashes, the six package IDs, a mode token, and private proof storage. Verify and restore check the exact committed after-image.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 3 canonical model: only the approved opportunity amounts, amount states and stage, valuation amounts/states, and calculation output/run states may change. Unsized opportunities become signals rather than remaining labeled quantified. Every scoped row is archived before commit.
- Layer 4 products: the job checks that the installed opportunity and action-candidate projections have no exposed amount after apply. No product code changes.
- Layer 1 intake and Layer 2 adapters: unchanged.

## Client Applicability

- All clients: inert operator capability until an explicitly scoped job runs.
- Specific clients: one synthetic canonical writer declaration and its six package IDs; the release record intentionally omits tenant identifiers.
- Internal only: archive tables, ACA job, and private proof.
- Public/demo only: none.
- Feature flag: none; apply and restore require exact mode tokens.

## Changes Included

- Additive service-role RLS migration for run metadata and full row before-images.
- Four named ACA operator scripts: plan, apply, verify, restore.
- Scoped transaction, Layer 4 readback, private Blob prepared/final proof, and compare-and-swap restore.
- Disposable PostgreSQL integration coverage.

## QA / Validation

- Disposable PostgreSQL test: plan/apply/verify/restore, prepared-proof rollback, archive tamper, after-image drift, and other-tenant isolation pass.
- JavaScript syntax check, scoped lint, release check, and diff check: see branch validation output.
- Azure schema, Blob, ACA, and signed-in product proof: not run.

## Rollout Plan

Apply the additive migration through the approved database lane, then build a digest-pinned image through the repository deploy workflow. Submit plan with the private ACA operator wrapper. Review exact IDs, row and projection hashes, and operator proof. Apply only with the corresponding mode token and hashes; run verify and signed-in readback after execution. No job is submitted by this release candidate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: required at job invocation; not selected here.
- ACA runtime invariant: must be proved by the deploy lane before any live claim.
- Worker image invariant: required before job execution.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after any approved apply.

## Rollback Plan

Run the restore ACA job with the original run ID, before-image hash, exact after-image hash, and restore token. Restore refuses any intervening row change or archive mismatch. Migration tables remain as audit evidence.

## Audit Evidence

- Plan summary with exact hashes and table counts.
- Durable service-role archive and run row.
- Private Blob prepared/final proof with readback.
- ACA execution and wrapper logs, then Layer 4 and signed-in readback after an approved run.

## Known Gaps

- No Azure mutation, migration application, or live product proof has been performed for this candidate.
