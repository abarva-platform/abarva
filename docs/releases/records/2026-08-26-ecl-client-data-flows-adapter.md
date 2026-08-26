# 2026-08-26-ecl-client-data-flows-adapter — ECL Client Data Flows Adapter

## Release ID

`2026-08-26-ecl-client-data-flows-adapter`

## Status

`candidate`

## Plain-English Summary

Adds a local proof adapter for the data flows and integrations intake family. The adapter maps source and target endpoints, flow patterns, cadence, landing and consumption layers, regulated-data flags, and interface ownership into ECL source and context rows while preserving partial intake as reviewable gaps.

## Layer Impact

- Affected lane: `L-CLIENT`.
- Layer 2 SOURCE ADAPTERS: adds the SP13 data flows/integrations adapter.
- Layer 3 CANONICAL MODEL: emits local proof rows for `ecl_source.source_file`, `ecl_source.source_record`, `ecl_context.object`, and `ecl_context.relationship`.
- Layer 4 PRODUCTS: updates status/proof wiring only; no product route behavior changes.

## Client Applicability

- All clients: adapter pattern is available after merge.
- Specific clients: none.
- Internal only: local proof and status tracking.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/load_client_intake_data_flows_layer.py`
- `scripts/ecl/__tests__/run-ecl-client-intake-data-flows-adapter-tests.mjs`
- ECL no-stop workflow proof wiring.
- Package script wiring for the SP13 load and proof commands.
- Four-lane status writer/status artifact updates for the L-CLIENT adapter lane.

## QA / Validation

- PASS: `npm run test:ecl-client-intake-data-flows-adapter`
- PASS: `ECL_RECONCILE_REF=HEAD npm run test:ecl-four-lane-status`
- PASS: `npm run test:npm-script-targets`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

The SP13 proof uses disposable Postgres, loads the draft ECL schema, applies generated adapter SQL, validates flow counts and partial-review states, preserves unresolved platform endpoint references as unknown/in-review objects, and plants broken relationship endpoint operations to prove FKs reject unresolved or deleted endpoints.

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

- Adapter: `scripts/ecl/load_client_intake_data_flows_layer.py`
- Proof: `scripts/ecl/__tests__/run-ecl-client-intake-data-flows-adapter-tests.mjs`
- Status: `docs/architecture/ecl-four-lane-completion-status.json`

## Known Gaps

The adapter does not repair unresolved platform endpoint names in the source extract. It preserves them as unknown/in-review data platform references so downstream products can surface the gap rather than treating the flow as fully resolved.
