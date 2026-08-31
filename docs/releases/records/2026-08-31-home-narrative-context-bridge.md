# 2026-08-31-home-narrative-context-bridge — Home Narrative Context Bridge

## Release ID

`2026-08-31-home-narrative-context-bridge`

## Status

`candidate`

## Plain-English Summary

This release tightens the Home executive narrative generation path so the chapter writer receives the same governed source and page context described by the Home V2 prompt contract. The change promotes source-backed enterprise profile, segment, strategy, program, and interview records into citable context items, and passes page-specific source summaries, category summaries, visual dataset names, and citable context to the chapter synthesis prompt.

## Layer Impact

Release lane: `global-control-lane`.

Layer 3 — Canonical/governed context: no physical schema change. Existing ECL source records and Home projection rows are transformed into richer governed context before model generation.

Layer 4 — Products/Home: Home narrative generation uses richer page-specific context while preserving the evidence boundary. Source-family summaries remain coverage context unless a matching citable context item or assigned claim supports the visible assertion.

## Client Applicability

- All clients: applies to Home narrative generation when the ECL Home narrative job runs.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Home narrative generation/write gates remain unchanged.

## Changes Included

- `scripts/ecl/build_home_ecl_narrative_layer.ts`
- `scripts/data-build/build-home-chapters.ts`
- `scripts/data-build/build-enterprise-thesis.ts`
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`

## QA / Validation

- `npx eslint scripts/ecl/build_home_ecl_narrative_layer.ts scripts/data-build/build-home-chapters.ts scripts/data-build/build-enterprise-thesis.ts scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs` — passed.
- `node scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs` — passed.
- `git diff --check` — passed.

## Rollout Plan

Merge through a pull request. The change affects the next Home ECL narrative generation run; it does not by itself mutate Azure data, change routes, or shift traffic.

## Deployment Authority

- Repo-owned deploy workflow: required only if the merged code is deployed to the shared web/runtime image.
- Shared runtime mutators: none in this PR.
- Approved image digest: not applicable until deployment.
- ACA runtime invariant: required after any deployment.
- Worker image invariant: unchanged.
- Feature/env flag update path: unchanged.
- Live signed-in proof required: required after a deployed narrative regeneration before claiming product proof.

## Rollback Plan

Revert the PR and rerun the Home narrative generation job from the previous approved code path if the richer context bridge produces unacceptable output.

## Audit Evidence

- Pull request and merge commit.
- The commands listed in QA / Validation.
- Any future Home narrative generation/readback proof bundle produced after this release.

## Known Gaps

This release fixes the context passed to the writer. It does not itself regenerate/publish a new Home narrative, redesign the Home page layout, or prove the rendered live page.
