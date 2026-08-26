# 2026-08-26-ecl-client-kpi-operations-adapter — ECL Client KPI Operations Adapter

## Release ID

`2026-08-26-ecl-client-kpi-operations-adapter`

## Status

`candidate`

## Plain-English Summary

Adds a local proof adapter for the KPI and operations intake family. The adapter preserves operational KPI rows, maps function and application references into the ECL canonical model, and keeps questionable KPI units visible for review instead of silently correcting them.

## Layer Impact

- Affected lane: `L-CLIENT`.
- Layer 2 SOURCE ADAPTERS: adds the SP10 KPI/operations adapter.
- Layer 3 CANONICAL MODEL: emits local proof rows for `ecl_source` and `ecl_context`.
- Layer 4 PRODUCTS: updates status/proof wiring only; no product route behavior changes.

## Client Applicability

- All clients: adapter pattern is available after merge.
- Specific clients: none.
- Internal only: local proof and status tracking.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/load_client_intake_kpi_operations_layer.py`
- `scripts/ecl/__tests__/run-ecl-client-intake-kpi-operations-adapter-tests.mjs`
- ECL no-stop workflow proof wiring.
- Package script wiring for the SP10 load and proof commands.
- Four-lane status writer/status artifact updates for the L-CLIENT adapter lane.

## QA / Validation

- PASS: `npm run test:ecl-client-intake-kpi-operations-adapter`
- PENDING UNTIL COMMIT: `ECL_RECONCILE_REF=HEAD npm run test:ecl-four-lane-status`
- PASS: `npm run test:npm-script-targets`
- PENDING AFTER RECORD FIX: `npm run release:check -- --base origin/main --head HEAD`
- PENDING: `git diff --check`

The SP10 proof uses disposable Postgres, loads the draft ECL schema, applies the generated adapter SQL, validates row counts and review states, preserves semantic unit mismatches as partial/in-review evidence, and plants a broken measure-subject reference to prove the FK rejects unresolved objects.

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

- Adapter: `scripts/ecl/load_client_intake_kpi_operations_layer.py`
- Proof: `scripts/ecl/__tests__/run-ecl-client-intake-kpi-operations-adapter-tests.mjs`
- Status: `docs/architecture/ecl-four-lane-completion-status.json`

## Known Gaps

This adapter does not fix source KPI unit quality. It preserves mismatched units and routes those rows to review so the source extract can be corrected upstream.
