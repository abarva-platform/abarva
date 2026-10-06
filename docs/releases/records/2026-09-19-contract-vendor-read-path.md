# 2026-09-19 Contract Vendor Read Path

## Release ID

`2026-09-19-contract-vendor-read-path`

## Status

`candidate`

## Plain-English Summary

Gives the vendor panel a real way to find out which legal entities a tenant is already under contract with, and — more importantly — a way to tell that it could not find out. The contract register's vendor column is nullable, so "no vendors came back" has three causes: the tenant has no contracts, the tenant has contracts that name no vendor, or the read failed. Only the first is an answer. The previously shipped panel refuses to render when contract evidence is absent, and that refusal was untestable against a real caller because no caller existed.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 2/3 read path plus the mapping helper that feeds the layer 4 projection.
- Read-only. No schema change, no migration, no write path.
- Queries two existing relations in the canonical schema; adds none.

## Client Applicability

- All clients: no client-facing change yet, because no surface calls the reader.
- No data, schema, configuration, or tenant behavior change.

## Changes Included

- Add `readContractVendorLegalEntityIds`, returning one of four states: available, no contracts, linkage unpopulated, or unavailable.
- Separate "this tenant has contracts and not one of them names a vendor" from "this tenant has no contracts", because collapsing them presents every incumbent supplier as a new candidate while the surface looks healthy.
- Report a summary query that returns no row with its own explanation rather than reaching the same state by way of a thrown type error.
- Count contracts naming a vendor that no canonical vendor row matches, so register and vendor-master drift is visible instead of silently dropped.
- Add `toVendorPanelContractInput`, so the mapping from read state to the panel's two inputs lives in one place. Getting that mapping wrong is silent.
- Add a behavior suite, including an end-to-end case that drives the real projection from the real reader.

## QA / Validation

- PASS: new behavior suite passes 8 of 8 cases.
- PASS: mutation harness catches 7 of 7 seeded defects. An earlier run had one survivor — removing the explicit missing-summary-row guard — because the surrounding error handler reached the same state by accident and no assertion could tell the two apart. The guard now explains itself and the case asserts that explanation; the rerun caught it.
- PASS: TypeScript (`npx tsc -p tsconfig.json --noEmit`, Node 24 with an 8 GB heap), exit code 0.
- PASS: scoped ESLint on both new files, exit code 0.

## Rollout Plan

Merge through the protected pull-request lane. Deploy only through the repository-owned ACA main workflow. No surface calls the reader, so merging changes no rendered behavior.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None.
- Approved image digest: Pending repository-owned deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: Required after deployment.
- Feature/env flag update path: None.
- Live signed-in proof required: No. Nothing is rendered by this change.

## Rollback Plan

Delete the reader, the mapping helper, and their behavior suite. Nothing imports them, so no runtime, data, or schema rollback is required.

## Audit Evidence

- Behavior suite output.
- Mutation harness output, including the surviving mutation and the change made to catch it.
- TypeScript and lint exit codes.
- The foreign key establishing that the two identifier spaces are the same one, rather than an assumption that they are.

## Known Gaps

The suite exercises the reader against a scripted query runner, not against a live database, so the SQL itself is unproven beyond review. No surface calls the reader yet. The unresolved-reference count is reported and nothing consumes it; deciding what should happen when it rises is a separate question.
