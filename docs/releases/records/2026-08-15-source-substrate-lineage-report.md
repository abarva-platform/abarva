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
- BLOCKED: `npm run audit:source-substrate-lineage -- --tenant skyharbor_global` could not complete
  from the local machine because the configured Azure/Postgres hostname did not resolve.
- PASS: `npm run release:check`

## Rollout Plan

Merge to main. No Azure Container Apps runtime deploy is required because this is a docs and
read-only audit-script change. Operators and agents can run the report from the repo after merge.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no product runtime path changes.

## Rollback Plan

Revert the PR. No data migration, runtime image, or feature flag rollback is required.

## Audit Evidence

- PR URL after publication.
- Local validation commands listed above.
- Generated report under `reports/source-substrate-lineage/` when the script is run.

## Known Gaps

The first version covers Source portfolio, Contract 360, and Cube/canary headline metrics. It does
not yet cover every contract-level evidence family or document parsing output.
