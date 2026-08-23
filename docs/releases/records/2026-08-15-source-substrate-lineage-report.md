# 2026-08-15-source-substrate-lineage-report — Source Substrate Lineage Proof

## Release ID

`2026-08-15-source-substrate-lineage-report`

## Status

`candidate`

## Plain-English Summary

Adds a Source-specific lineage report so Source portfolio values, contract counts, vendor counts,
Contract 360 totals, and Cube or canary metrics can be proved from the owning Source substrate before
they are quoted. The report keeps legitimate counting-basis differences visible instead of turning
them into false conflicts.

This follow-up hardens the report after live readback showed four configured Source/Cube sources were
failing with a SQL parameter-count error. The report now passes only the parameter values each source
query actually uses and fails closed when any configured Source read errors remain.

A second live readback showed the report was still over-strict in two places: one read model counted
vendor portfolio rows while labeling the metric as distinct vendors, and a contract-row read model
was being compared against a contract-family Cube projection for committed value and auto-renew
counts. This follow-up makes the vendor count query match its declared basis and records the
row-versus-family splits as explicit basis differences.

This update extends the report to the Source optimization substrate: opportunity counts, opportunity
amounts, finance-confirmed value, evidence requirement counts, evidence-ready counts, evidence-gap
counts, and evidence-object counts. It also makes missing-vs-zero explicit: aggregate queries expose
their source-row count, `ABSENT` remains unknown, and a zero is quoteable only when backed by
governed source rows.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 / canonical projections: adds a read-only audit report over Source read models and Cube
  projections. It does not change data.
- Layer 4 / products: updates agent and architecture guidance so Source product figures use the new
  Source lineage report rather than the Tower tenant-intake lineage report.

## Client Applicability

- All clients: yes, for Source read-model and Cube figures.
- Specific clients: none.
- Internal only: the report is an internal audit/proof tool.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/source/source-substrate-lineage-report.mjs`
- `datasets/source/source-substrate-lineage-scope.json`
- `scripts/source/__tests__/source-substrate-lineage-report.test.mjs`
- `AGENTS.md`
- `docs/architecture/ENTERPRISE_INFORMATION_ARCHITECTURE.md`
- `package.json`

## QA / Validation

- PASS: `node --check scripts/source/source-substrate-lineage-report.mjs`
- PASS: `node --test scripts/source/__tests__/source-substrate-lineage-report.test.mjs`
- PASS: Regression coverage confirms one-parameter Source/Cube queries no longer receive the
  supplemental-vendor parameter intended only for `source.contract_360`.
- PASS: Regression coverage confirms vendor portfolio counts use distinct vendor references and
  contract-row versus contract-family committed-value or auto-renew differences are declared basis
  differences, not false conflicts.
- PASS: Regression coverage confirms Source opportunity/evidence substrates are included.
- PASS: Regression coverage confirms no source rows produce `ABSENT` rather than a false zero.
- PASS: Regression coverage confirms row-backed zero evidence-gap counts remain quoteable.
- PENDING: Run `npm run audit:source-substrate-lineage -- --tenant skyharbor_global` from the
  deployed ACA runtime after merge, because the configured Azure/Postgres hostname does not resolve
  from the local shell.
- PASS: `npm run release:check`

## Rollout Plan

Merge to main and deploy through the repo-owned ACA workflow so the read-only report can be run from
the same runtime that has the Source database binding. No tenant data is mutated.

## Deployment Authority

- Repo-owned deploy workflow: required for the live DB-backed proof run.
- Shared runtime mutators: none.
- Approved image digest: captured by the ACA main deploy workflow after merge.
- ACA runtime invariant: required before claiming live proof.
- Worker image invariant: required before claiming live proof.
- Feature/env flag update path: none.
- Live signed-in proof required: no browser proof required because no product runtime path changes;
  live ACA readback of the report is required.

## Rollback Plan

Revert the PR. No data migration, runtime image, or feature flag rollback is required.

## Audit Evidence

- PR URL after publication.
- Local validation commands listed above.
- Generated report under `reports/source-substrate-lineage/` when the script is run.

## Known Gaps

This report covers Source portfolio, Contract 360, Cube/canary headline metrics, optimization
opportunity amounts, finance-confirmed value, and evidence-readiness counts. It does not yet prove
every document-parsing output or clause-level extraction value.
