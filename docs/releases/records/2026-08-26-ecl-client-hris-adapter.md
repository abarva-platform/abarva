# 2026-08-26-ecl-client-hris-adapter - ECL Client HRIS Adapter

## Release ID

`2026-08-26-ecl-client-hris-adapter`

## Status

`candidate`

## Plain-English Summary

Adds a local proof adapter for the HRIS intake family. The adapter maps workforce summary rows at function, role-family, and location-segment grain into ECL source and context rows while preserving known gaps and follow-up states.

## Layer Impact

- Affected lane: `L-CLIENT`.
- Layer 2 SOURCE ADAPTERS: adds the SP02 HRIS adapter.
- Layer 3 CANONICAL MODEL: emits local proof rows for `ecl_source.source_file`, `ecl_source.source_record`, `ecl_context.object`, `ecl_context.relationship`, `ecl_context.metric_definition`, and `ecl_context.measure`.
- Layer 4 PRODUCTS: updates status/proof wiring only; no product route behavior changes.

## Client Applicability

- All clients: adapter pattern is available after merge.
- Specific clients: none.
- Internal only: local proof and status tracking.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/load_client_intake_hris_layer.py`
- `scripts/ecl/__tests__/run-ecl-client-intake-hris-adapter-tests.mjs`
- ECL no-stop workflow proof wiring.
- Package script wiring for the SP02 load and proof commands.
- Four-lane status writer/status artifact updates for the L-CLIENT adapter lane.

## QA / Validation

- PASS: `npm run test:ecl-client-intake-hris-adapter`
- PASS: `ECL_RECONCILE_REF=HEAD npm run test:ecl-four-lane-status`
- PASS: `npm run test:npm-script-targets`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

The SP02 proof uses disposable Postgres, loads the draft ECL schema, applies generated adapter SQL, validates source rows, workforce segment counts, metrics, measures, unknown-not-zero handling, and plants a broken relationship endpoint to prove FKs reject unresolved references.

## Rollout Plan

Merge through the protected PR path. This release has no ACA deploy, Azure data-build execution, route repointing, traffic shift, or shared runtime mutation.

## Deployment Authority

- Repo-owned deploy workflow: not used.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR. Since this is local adapter/proof code only, rollback does not require data-plane cleanup.

## Audit Evidence

- Adapter: `scripts/ecl/load_client_intake_hris_layer.py`
- Proof: `scripts/ecl/__tests__/run-ecl-client-intake-hris-adapter-tests.mjs`
- Status: `docs/architecture/ecl-four-lane-completion-status.json`

## Known Gaps

The adapter intentionally does not load employee-level records. It maps workforce summaries only, matching the intake grain and avoiding unnecessary collection of individual HR records.
