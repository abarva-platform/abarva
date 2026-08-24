# 2026-08-24-ecl-w4-serving-route-fence — ECL Serving Route Fence

## Release ID

`2026-08-24-ecl-w4-serving-route-fence`

## Status

`candidate`

## Plain-English Summary

Moves the non-default ECL preview providers for Home, Source, Tower, and Intelligence away from
direct product projection table reads and onto the `serving` contract. Adds a local guard that scans
product runtime code and fails when it reads product projection backings directly instead of through
`serving.*`.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Product Projections: no projection tables are changed.
- Layer 5 Serving: product preview providers consume the serving views created by the W3 contract.
- Layer 6 Product Pages: non-default ECL preview providers are rewired locally; default-provider
  cutover and browser proof remain separate gates.

## Client Applicability

- All clients: serving-contract runtime guard only, once deployed.
- Specific clients: none.
- Internal only: local proof and preview-provider readiness.
- Public/demo only: none.
- Feature flag/provider: existing non-default ECL preview provider switches.

## Changes Included

- Home ECL preview reads all 16 Home serving views and builds the existing Home review bundle from
  their payloads.
- Source workspace ECL DB provider reads Source serving views for contract, vendor, and event rows.
- Tower ECL preview reads `serving.tower_command_center`.
- Intelligence ECL preview reads context-pack serving views.
- Adds `test:ecl-product-serving-route-fence`, generated from the 40-surface plan enumeration, to
  prevent product runtime code from reading product projection tables directly.

## QA / Validation

- `npm run test:ecl-product-serving-route-fence` passed with 3,516 runtime files scanned, 40
  enumerated surfaces, 12 fenced projection backings, and 0 violations.
- Focused Jest adapter tests passed for Source workspace, Home ECL bundle mapping, and Intelligence
  context preview. Jest emitted pre-existing duplicate manual mock warnings; the focused suites
  passed.
- `ECL_RECONCILE_REF=$(git rev-parse HEAD) npm run test:ecl-projection-schema-reconciliation`
  passed before the W4 edits; rerun after rebase before merge.

## Rollout Plan

Merge by PR after W3 is on `main` and W4 is rebased onto the W3 squash. No shared data-plane load,
default-provider repoint, deployment, traffic change, or browser-proof claim is included in this
release.

## Deployment Authority

- Repo-owned deploy workflow: not used by this release.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: existing non-default provider switches only.
- Live signed-in proof required: required before claiming any product surface is live-proven.

## Rollback Plan

Revert the PR. Existing non-default ECL preview providers will return to their prior projection-table
read path. No data cleanup is required because this release does not mutate data.

## Audit Evidence

- Local command: `npm run test:ecl-product-serving-route-fence`.
- Local command: focused Jest tests for Home, Source workspace, and Intelligence ECL preview.
- Guard source: `scripts/ecl/__tests__/run-ecl-product-serving-route-fence-tests.mjs`.

## Known Gaps

- Source cube reads still use the cube substrate directly; cube serving views are a separate future
  slice.
- No Azure serving readback in this release.
- No signed-in browser proof in this release.
- No default provider cutover in this release.
