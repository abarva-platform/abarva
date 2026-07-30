# 2026-07-29-airline-data-quality-reconciliation-repair — Data Quality Reconciliation Repair

## Release ID

`2026-07-29-airline-data-quality-reconciliation-repair`

## Status

`candidate`

## Plain-English Summary

This release repairs the governed reconciliation path so source quality findings map to the actual
data operating model. Parser-visible sources are separated from registered reference material,
source evidence-gap fields are promoted into governed evidence gaps, table-level consumption
projections are registered individually, and field reconciliation traces source fields through
accepted canonical facts or explicit review disposition.

## Layer Impact

- `client-data-lane` Layer 2 — Source adapters: readback proof now audits parser-visible source files rather than
  treating every registered reference file as parser output.
- `client-data-lane` Layer 3 — Canonical model: accepted source rows with explicit evidence-gap fields now create
  governed gap records before publication.
- `client-data-lane` Layer 4 — Products and consumption: each consumption table receives its own projection-version
  record so products and audits can bind to the exact read model they consume.
- `global-control-lane` QA/readback tooling: the shared reconciliation audit now traces source
  rows and fields through canonical facts or explicit review disposition before reporting variance.

## Client Applicability

- All clients: applies to the shared governed processing/reconciliation code path.
- Specific clients: current validation target is the governed lab tenant using the new data plane.
- Internal only: proof upload/readback and reconciliation audit behavior.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/knowledge/processing/executor-framework.mjs`
- `scripts/qa/airline-e2e-live-reconciliation-readback.mjs`

## QA / Validation

- `node --check scripts/knowledge/processing/executor-framework.mjs` — pass.
- `node --check scripts/qa/airline-e2e-live-reconciliation-readback.mjs` — pass.
- `node scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs` — pass.
- `node scripts/knowledge/__tests__/run-review-batch-dimensions-tests.mjs` — pass.
- Local readback smoke with DB disabled confirmed the authoritative parser-visible source set:
  25 files, 99,883 rows, and 1,014,830 field instances.

## Rollout Plan

Merge through PR, deploy through the repo-owned Azure Container Apps main lane, then rerun the
governed VNet reconciliation readback job. If the job reports remaining parser-visible data defects,
continue remediation in a follow-up release without mutating review decisions, publications, or
baseline identity unless explicitly authorized.

## Deployment Authority

- Repo-owned deploy workflow: required for the shared web/runtime image.
- Shared runtime mutators: no ad-hoc shared web traffic mutation.
- Approved image digest: captured after ACA main deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: governed job image must match the deployed digest before live readback.
- Feature/env flag update path: none.
- Live signed-in proof required: not for this proof tooling change; VNet job proof is required.

## Rollback Plan

Revert the PR and redeploy the previous digest. The change does not alter existing review decisions,
published baseline identity, or source files. If a projection rebuild was run with this code, rerun
the previous projection-build job or restore the prior active baseline/projection pointer according
to the governed rollback record.

## Audit Evidence

- PR and CI checks for this release.
- ACA deploy run and digest after merge.
- Governed VNet reconciliation readback proof bundle after deploy.

## Known Gaps

This release does not redesign the product UI. It repairs data-quality accounting and projection
registration so UI certification has trustworthy source-to-consumption evidence.
