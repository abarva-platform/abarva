# 2026-08-28-home-ecl-narrative-published-structure-gate — Home ECL Narrative Published Structure Gate

## Release ID

`2026-08-28-home-ecl-narrative-published-structure-gate`

## Status

`candidate`

## Plain-English Summary

This release corrects the Home ECL narrative writer publication gate so it evaluates the final
published thesis after verifier repairs and drops, rather than blocking on raw draft claims that do
not reach publication. The gate remains strict: published model-generated claims must still pass
the structural bar, and unresolved publication issues still block writes.

## Layer Impact

- `global-control-lane`: hardens shared Home ECL operator writer behavior.
- Layer 4 PRODUCTS: updates the Home ECL projection writer gate. No product-owned data is
  introduced.
- Layer 3 CANONICAL MODEL: unchanged.
- Layer 2 SOURCE ADAPTERS: unchanged.
- Layer 1 CLIENT INTAKE: unchanged.

## Client Applicability

- All clients: yes, when the Home ECL narrative writer is run.
- Specific clients: none named.
- Internal only: operator proof/readback tooling.
- Public/demo only: no.
- Feature flag: existing `HOME_ECL_NARRATIVE_WRITE` and `HOME_ECL_NARRATIVE_WRITE_APPROVED` gates
  remain required.

## Changes Included

- `scripts/data-build/build-enterprise-thesis.ts` makes structural validation and claim enumeration
  tolerate verifier-dropped claims.
- `scripts/ecl/build_home_ecl_narrative_layer.ts` computes publication-gate structural issues from
  `publishedGeneration`, while retaining raw structural issue counts in writer metadata.
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs` asserts the Home ECL publication
  gate checks the published thesis structure.

## QA / Validation

- Pass: `npm run test:ecl-home-narrative-layer`.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps deploy workflow publishes the updated operator
code in the normal digest-pinned image. A governed ACA operator job is required to attempt a Home
ECL narrative write under this corrected gate.

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

Revert the merge commit. Previously generated Home ECL projection rows remain unchanged; the
rollback only restores the stricter raw-draft structural block for future writer runs.

## Audit Evidence

- Failed governed writer apply before this fix:
  `/tmp/home-ecl-narrative-apply-20260828T160502Z/summary.json`.
- PR URL after creation.
- CI checks after PR creation.
- Deploy workflow run after merge.

## Known Gaps

This release does not itself regenerate Home narrative content. It enables a subsequent governed
writer apply/readback attempt to publish only if the final published thesis has no remaining
publication-gate issues.
