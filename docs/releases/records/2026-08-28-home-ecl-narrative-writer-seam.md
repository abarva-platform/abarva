# 2026-08-28-home-ecl-narrative-writer-seam — Home ECL Narrative Writer Seam

## Release ID

`2026-08-28-home-ecl-narrative-writer-seam`

## Status

`candidate`

## Plain-English Summary

Adds an operator-side path that can generate Home narrative from governed ECL projection rows using the existing verified Home thesis and chapter writer. The script is plan-only by default and writes back to ECL projection tables only when explicitly approved by environment flags.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 canonical model: no change.
- Layer 4 product projections: adds a governed write path for Home narrative rows in `ecl_projection.home_enterprise_landscape`.
- Operator tooling: adds a plan/apply script for generating Home narrative from ECL rows without reviving the legacy Home knowledge-pack table.

## Client Applicability

- All clients: available as an operator capability after deployment.
- Specific clients: none hard-coded by the release.
- Internal only: generation and apply scripts are operator-only.
- Public/demo only: none.
- Feature flag: writes require `HOME_ECL_NARRATIVE_WRITE=true` and `HOME_ECL_NARRATIVE_WRITE_APPROVED=true`.

## Changes Included

- Exposes the existing EnterpriseThesis generator as a reusable signal-packet verifier.
- Exposes the existing Home chapter writer as a reusable chapter assembly function.
- Adds `scripts/ecl/build_home_ecl_narrative_layer.ts`.
- Adds `npm run ecl:home-narrative:plan`, `npm run ecl:home-narrative:apply`, and `npm run test:ecl-home-narrative-layer`.

## QA / Validation

Candidate validation:

- PASS — `npm run test:ecl-home-narrative-layer`.
- PASS — import smoke for `scripts/ecl/build_home_ecl_narrative_layer.ts` using the repo dependency tree.
- PASS — `npm run test:npm-script-targets`.
- BLOCKED — full `tsc --noEmit` is not a clean signal in this checkout because the repo-level command sweeps archived docs/tests/tools with pre-existing type failures; no new-code type error was observed by the import smoke.
- PENDING — `npm run release:check` before PR merge.

## Rollout Plan

Merge to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow. The script does not run automatically on deploy. Any data-plane write must run as a governed operator job with the write flags set.

## Deployment Authority

- Repo-owned deploy workflow: required for runtime image availability.
- Shared runtime mutators: none in this release.
- Approved image digest: resolved by the ACA main deploy workflow.
- ACA runtime invariant: required before claiming deployed.
- Worker image invariant: not changed.
- Feature/env flag update path: operator job environment only.
- Live signed-in proof required: not for this operator script; Home browser proof is required after an approved apply run.

## Rollback Plan

Revert the PR to remove the operator script and exported helper seams. If narrative rows were written, rerun the dense ECL projection load or delete only `chapter_claim` rows plus restore summary rows from the prior proof bundle.

## Audit Evidence

- PR URL and squash commit.
- `npm run test:ecl-home-narrative-layer` output.
- TypeScript validation output.
- ACA deploy workflow run if deployed.
- Operator job proof bundle if an apply run is authorized.

## Known Gaps

This release adds the seam and guarded writer path. It does not itself run the model, mutate Azure data, or prove Home narrative in the browser.
