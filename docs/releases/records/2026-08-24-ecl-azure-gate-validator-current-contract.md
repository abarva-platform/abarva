# 2026-08-24-ecl-azure-gate-validator-current-contract - ECL Azure Gate Validator Current Contract

## Release ID

`2026-08-24-ecl-azure-gate-validator-current-contract`

## Status

`candidate`

## Plain-English Summary

Updates the dense ECL Azure gate validator so it validates the generated readback contract instead
of stale hardcoded row totals. This keeps the gate useful when the dense ECL model adds legitimate
objects, relationships, platforms, or integrations.

## Layer Impact

- Release lane: `client-data-lane`.
- Layer 4 projections and cubes: validation now accepts current generated counts while still
  enforcing required readback keys and zero-drift invariants.
- Azure data-build governance: the gate package validator remains non-mutating and continues to
  block execution, route repointing, browser-proof claims, and legacy retirement.

No runtime data, schema, route, deployment, tenant input, or Azure resource is changed by this PR.

## Client Applicability

- All clients: applies to future dense ECL load-gate validation.
- Specific clients: none.
- Internal only: execution tooling and QA gates.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Updates `scripts/ecl/validate_ecl_dense_azure_load_gate_package.py`.
- Adds `scripts/ecl/__tests__/run-ecl-dense-azure-gate-validator-tests.mjs`.
- Adds `test:ecl-dense-azure-gate-validator`.

## QA / Validation

- Pass expected before merge: `npm run test:ecl-dense-azure-gate-validator`.
- Pass expected before merge: `npm run release:check`.

## Rollout Plan

Merge to `main`. No ACA deploy, migration, data load, product route repoint, feature flag, or Azure
resource update is required for this validator-only release.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the validator and test commit if the gate needs to return to fixed-count validation.

## Audit Evidence

- PR diff for the validator and test.
- `npm run test:ecl-dense-azure-gate-validator` output.
- `npm run release:check` output.

## Known Gaps

- This PR does not run Azure data builds or product browser QA. It only fixes local gate validation.
