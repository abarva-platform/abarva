# 2026-08-29-home-ecl-terminal-quality — Home ECL Terminal Quality Guard

## Release ID

`2026-08-29-home-ecl-terminal-quality`

## Status

`candidate`

## Plain-English Summary

Home ECL narrative publication now turns weak terminal chapter wording into an explicit executive-review terminal state before the final visible-language gate runs. The Home evidence UI also stops exposing raw internal evidence identifiers on executive surfaces; it renders register labels and reference counts instead.

## Layer Impact

- Lane: `global-control-lane`
- Layer 4 Products: Home preview rendering and Home ECL narrative publication guard.

## Client Applicability

- All clients using Home ECL preview/default provider behavior.
- No client data model, source file, canonical table, or projection schema changes.

## Changes Included

- `scripts/ecl/build_home_ecl_narrative_layer.ts`
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`
- `src/components/home/preview/evidence-resolver.ts`
- `src/components/home/preview/ClaimCard.tsx`
- `src/components/home/preview/__tests__/ClaimCard.test.tsx`
- `src/components/home/v4/source-label.ts`

## QA / Validation

- PASS: `npm run test:ecl-home-narrative-layer`
- PASS: targeted Home preview component tests.
- PASS: `git diff --check`
- PASS: `npm run release:check`

## Rollout Plan

Merge through pull request. The repo-owned Azure Container Apps main deploy workflow publishes the runtime change. Then rerun the governed Home narrative apply/readback job with the deployed digest and capture signed-in Home browser proof.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this code change.
- Data job after deploy: Home narrative apply/readback only, tenant scoped.
- Live signed-in proof required: Home default route and Home diagnostics route.

## Rollback Plan

Revert this pull request. If a Home narrative apply ran on this version, rerun the prior accepted Home narrative apply job from the rollback digest or restore from the last accepted proof bundle.

## Audit Evidence

- Pull request, CI output, ACA deployment evidence, Home narrative apply/readback output, and signed-in browser screenshots after data refresh.

## Known Gaps

- Live proof is pending until this candidate is merged, deployed, the Home narrative apply/readback job is rerun on the deployed digest, and signed-in browser screenshots are captured.
