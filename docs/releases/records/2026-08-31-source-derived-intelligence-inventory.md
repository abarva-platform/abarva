# 2026-08-31-source-derived-intelligence-inventory — Source-Derived Intelligence Inventory

## Release ID

`2026-08-31-source-derived-intelligence-inventory`

## Status

`candidate`

## Plain-English Summary

Adds a governed source-intelligence design contract and an executable inventory builder that profiles
each canonical tenant source file before any model-assisted interpretation. The builder records file
hashes, schema fingerprints, row counts, fill rates, key dimensions, scaffold artifacts, and prompt
envelopes so the next step can analyze source files with exact context instead of thin product rows.

## Layer Impact

Affected lane: `global-control-lane`.

- `Layer 1 - Client Intake`: reads canonical repo-local synthetic tenant intake files from the
  declared registry root for the current demo path.
- `Layer 2 - Source Adapters`: adds a deterministic inventory and prompt-envelope scaffold before
  model-assisted source intelligence.
- `Layer 3 - Canonical Enterprise Model`: no canonical table mutation.
- `Layer 4 - Products`: no product runtime mutation.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: applies to internal build tooling for source-intelligence preparation.
- Public/demo only: supports the synthetic demo source-intelligence pass.
- Feature flag: none.

## Changes Included

- `docs/architecture/SOURCE_DERIVED_INTELLIGENCE_LAYER_2026_08_31.md`
- `scripts/ecl/build_source_intelligence_inventory.mjs`
- `scripts/ecl/__tests__/run-source-intelligence-inventory-tests.mjs`
- `package.json` scripts:
  - `ecl:source-intelligence:inventory`
  - `test:ecl-source-intelligence-inventory`

## QA / Validation

- Pass: `npm run test:ecl-source-intelligence-inventory`
- Pass: `npm run ecl:source-intelligence:inventory -- --ref origin/main --tenant meridian-health --assessment assessment-dense-source-room-20260823 --out-dir /tmp/source-intelligence-inventory-20260831b --include-source-content`

## Rollout Plan

Merge to main only. There is no Azure Container Apps rollout, migration apply, traffic shift,
feature flag, or data-plane mutation in this slice.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because this does not affect runtime routes.

## Rollback Plan

Revert the commit. No data-plane or product-runtime state is changed.

## Audit Evidence

- Unit proof: `npm run test:ecl-source-intelligence-inventory`
- Inventory proof: `/tmp/source-intelligence-inventory-20260831b/manifest.json`
- Download artifact: generated locally for operator inspection; not committed to the public repo.

## Known Gaps

This slice does not call Claude, verify model outputs, publish accepted source intelligence, update
ECL rows, or change Home. It creates the contract and deterministic inventory/prompt scaffold for
that next slice.
