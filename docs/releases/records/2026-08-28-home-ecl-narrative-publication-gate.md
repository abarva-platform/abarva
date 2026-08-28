# 2026-08-28-home-ecl-narrative-publication-gate — Home ECL Narrative Publication Gate

## Release ID

`2026-08-28-home-ecl-narrative-publication-gate`

## Status

`candidate`

## Plain-English Summary

This release makes the Home ECL narrative writer refuse publication when its model-generated prose
has unresolved publication-safety issues. Verification results are no longer only recorded as
metadata; the writer now records the repair/drop action tally and a publication gate, and readback
fails if the gate is not accepted.

## Layer Impact

- `global-control-lane`: hardens shared Home ECL operator writer/readback behavior for future
  narrative generations.
- Layer 4 PRODUCTS: hardens the Home ECL projection writer/readback contract. No product-owned data
  is introduced.
- Layer 3 CANONICAL MODEL: unchanged.
- Layer 2 SOURCE ADAPTERS: unchanged.
- Layer 1 CLIENT INTAKE: unchanged.

## Client Applicability

- All clients: yes, when the Home ECL narrative writer is run.
- Specific clients: none named.
- Internal only: operator proof/readback tooling.
- Public/demo only: no.
- Feature flag: existing `HOME_ECL_NARRATIVE_WRITE` and `HOME_ECL_NARRATIVE_WRITE_APPROVED` gates remain required.

## Changes Included

- `scripts/data-build/build-enterprise-thesis.ts` records publication issues when prose synthesis
  would otherwise fall back to raw draft prose.
- `scripts/ecl/build_home_ecl_narrative_layer.ts` refuses to write Home ECL narrative rows when
  publication-gate issues remain, and records verification action tallies.
- `scripts/ecl/readback_home_ecl_narrative_layer.ts` verifies written summary rows carry an accepted
  publication gate.
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs` covers the writer and readback
  guard.

## QA / Validation

- Pass: `npm run test:ecl-home-narrative-layer`.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps deploy workflow publishes the updated operator
code in the normal digest-pinned image. The gate affects future Home ECL narrative writer runs; it
does not mutate data by itself.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: resolved by the deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: unchanged.
- Live signed-in proof required: no, this is an operator writer/readback guard rather than a route
  rendering change.

## Rollback Plan

Revert the merge commit. Previously generated Home ECL projection rows remain unchanged; the rollback
only relaxes the writer/readback gate for future runs.

## Audit Evidence

- PR URL after creation.
- CI checks after PR creation.
- Deploy workflow run after merge.

## Known Gaps

This release does not regenerate Home narrative content. It prevents future unsafe publication states
from being written; a separate writer run is required to produce new content under this gate.
