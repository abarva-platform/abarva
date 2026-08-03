# 2026-08-03-source-v4-row-depth-contract — Source v4 Row Depth Contract

## Release ID

`2026-08-03-source-v4-row-depth-contract`

## Status

`candidate`

## Plain-English Summary

Adds a row-level depth contract for the next synthetic Source package. The standard requires every
generated extract row to carry source-system-native identifiers, lineage, quality state, evidence
state, and a business story thread so the package can pressure-test executive analytics, drill-downs,
Cube semantics, and evidence-backed recommendations without relying on filler data.

## Layer Impact

- `client-data-lane`: defines the acceptance standard for future synthetic tenant data; no tenant
  data is loaded by this change.
- CLIENT INTAKE: clarifies that generated templates and extracts must look like practical source
  system outputs, including specific systems of record and extraction instructions.
- SOURCE ADAPTERS: adds an executable pre-load row-depth verifier for generated CSV extracts.
- CANONICAL MODEL: no schema or canonical identity changes.
- PRODUCTS: no visible UI change.

## Client Applicability

- All clients: no production behavior change.
- Specific clients: applies to the synthetic airline Source v4 package when generated.
- Internal only: yes, this is a build/QA contract.
- Public/demo only: no public route is added.
- Feature flag: none.

## Changes Included

- `docs/source/SKYHARBOR_SOURCE_V4_ROW_DEPTH_CONTRACT.md` defines row anatomy, source-system depth
  requirements, planted story threads, question-backward acceptance rules, and data-quality gates.
- `scripts/source/verify-skyharbor-v4-row-depth.mjs` validates generated CSV directories for common
  lineage fields, native domain fields, quality/evidence states, and required planted story coverage.

## QA / Validation

- PASS: `node --check scripts/source/verify-skyharbor-v4-row-depth.mjs`.
- PASS: no-argument verifier invocation fails closed with usage guidance.
- PASS: release gate will run before PR merge.

## Rollout Plan

Merge through the normal PR path. The verifier is not invoked automatically by this PR; it becomes
the acceptance gate for the generated Source v4 CSV package before any ACA operator lab load.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no, because this is a data-generation contract and validator only.

## Rollback Plan

Revert the PR. No database, runtime, tenant pointer, or generated package rollback is required.

## Audit Evidence

- PR for this release.
- Local verifier syntax check.
- Future Source v4 proof bundle should include the row-depth verifier output.

## Known Gaps

- The actual Source v4 synthetic data package is not generated or loaded by this change.
- The row-depth verifier currently accepts a directory of generated CSV extracts; ZIP/package
  orchestration can wrap it once the v4 package layout is finalized.
