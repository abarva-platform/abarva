# 2026-10-01 Source RFP Sector Claim Discipline

## Release ID

`2026-10-01-source-rfp-sector-claim-discipline`

## Status

`candidate`

## Plain-English Summary

The RFP draft generator no longer treats a buyer's name or industry as authority for clinical workloads, data environments, certifications, or supplier obligations. Its quality review now flags specific unsupported sector and clinical claims, while allowing terms that are explicitly present in approved vendor-disclosable context. A flagged draft remains reviewable but cannot pass the quality gate on the strength of model judgment alone.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4, Source: tightens D09 draft instructions and quality review. It does not create canonical facts, approve a market package, or issue supplier communications.

## Client Applicability

- All clients: newly generated and reviewed D09 RFP drafts.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- D09 map-reduce and fallback prompts require bounded vendor-disclosable support for sector and clinical assertions.
- D09-specific deterministic quality checks cover unbound sector and service-context assertions, and evaluate each named compliance standard on a line.
- Adjacent negative and approved-context tests. No migration, data load, supplier delivery, or approval-rule change.

## QA / Validation

- Red-first: unsupported clinical-workload tests and the section-prompt contract failed before the fix.
- Green: 15 generation suites / 181 tests passed. Disabling the new sector detector made both negative tests fail; restoring it returned them to green. Separate multi-standard and explicit-absence cases failed before their respective corrections.
- Typecheck and scoped ESLint passed.
- Wider generation tests, release check, CI, and signed-in replay are recorded when completed; this candidate record does not claim them yet.

## Rollout Plan

Squash-merge after applicable validation. Only the repo-owned ACA main workflow may build and deploy the main image. Regenerate a signed-in D09 draft, read back its quality receipt, and check that unsupported claims remain blocked.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: pending official build.
- ACA runtime invariant: verify the web template, sole 100%-traffic revision, and both delivery-worker jobs on the same immutable digest.
- Worker image invariant: required.
- Feature/env flag update path: none.
- Live signed-in proof required: saved D09 body and quality receipt after regeneration.

## Rollback Plan

Revert through a new reviewed PR and the repo-owned main workflow. No schema or tenant-data rollback is needed.

## Audit Evidence

- Red/green and deliberate detector-disable mutation in focused test output.
- PR, CI, merge SHA, ACA run, and signed-in replay are linked in the private execution ledger when available.

## Known Gaps

This is a bounded draft-quality backstop, not a vendor-release packet or Legal approval. It does not create missing vendor-disclosable facts, an approved package, a recipient snapshot, or delivery receipts.
