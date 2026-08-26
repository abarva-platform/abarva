# 2026-08-26-ecl-client-ai-usage-models-adapter — ECL Client AI Usage Models Adapter

## Release ID

`2026-08-26-ecl-client-ai-usage-models-adapter`

## Status

`candidate`

## Plain-English Summary

Adds a local proof adapter for the AI usage and models intake family. The adapter maps AI tools, use cases, user personas, business functions, vendor references, and monthly usage measures into ECL while preserving unresolved vendor placeholders as review items.

## Layer Impact

- Affected lane: `L-CLIENT`.
- Layer 2 SOURCE ADAPTERS: adds the SP11 AI usage/models adapter.
- Layer 3 CANONICAL MODEL: emits local proof rows for `ecl_source` and `ecl_context`.
- Layer 4 PRODUCTS: updates status/proof wiring only; no product route behavior changes.

## Client Applicability

- All clients: adapter pattern is available after merge.
- Specific clients: none.
- Internal only: local proof and status tracking.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/ecl/load_client_intake_ai_usage_models_layer.py`
- `scripts/ecl/__tests__/run-ecl-client-intake-ai-usage-models-adapter-tests.mjs`
- ECL no-stop workflow proof wiring.
- Package script wiring for the SP11 load and proof commands.
- Four-lane status writer/status artifact updates for the L-CLIENT adapter lane.

## QA / Validation

- PASS: `npm run test:ecl-client-intake-ai-usage-models-adapter`
- PASS: `ECL_RECONCILE_REF=HEAD npm run test:ecl-four-lane-status`
- PASS: `npm run test:npm-script-targets`
- PASS: `git diff --check`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

The SP11 proof uses disposable Postgres, loads the draft ECL schema, applies generated adapter SQL, validates usage row counts and review states, preserves unresolved vendor placeholders as unknown/in-review references, and plants a broken relationship endpoint to prove the FK rejects unresolved objects.

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

- Adapter: `scripts/ecl/load_client_intake_ai_usage_models_layer.py`
- Proof: `scripts/ecl/__tests__/run-ecl-client-intake-ai-usage-models-adapter-tests.mjs`
- Status: `docs/architecture/ecl-four-lane-completion-status.json`

## Known Gaps

This adapter does not repair placeholder supplier values in the source extract. It preserves the raw values in source payloads and routes affected vendor references to review.
