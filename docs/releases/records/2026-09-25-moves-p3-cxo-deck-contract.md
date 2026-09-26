# 2026-09-25-moves-p3-cxo-deck-contract — Moves P3 CXO Deck Contract

## Release ID

`2026-09-25-moves-p3-cxo-deck-contract`

## Status

`candidate`

## Plain-English Summary

Moves P3 executive deliverables now align their declared PPTX final format with the deck renderer contract. The previous state allowed three P3 profiles to claim PPTX as the final format while still identifying an HTML architecture renderer, which created a contract mismatch between the profile, deck-length gate, and client-facing presentation expectation.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: updates Moves deliverable profile metadata and the generation/persistence routing that assembles client-facing artifacts. No Layer 1 client intake, Layer 2 adapter, or Layer 3 canonical data changes are included.

## Client Applicability

- All clients: Moves P3 deliverable generation/profile behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses existing Moves deliverable generation flags; this release does not add or change flags.

## Changes Included

- `src/lib/deliverables/profiles/registry.ts`: P3 solution approach, target architecture, and solution design profiles now use the deck renderer contract for their PPTX final format.
- `src/lib/deliverables/orchestrator/generate-service.ts`: Target Architecture structured-model assembly remains key-based instead of relying on the renderer label.
- `src/lib/deliverables/orchestrator/persistence.ts`: Target Architecture keeps the validated architecture preview/quality signal when a structured architecture model is present.
- `src/lib/deliverables/__tests__/slide-contract.test.ts`: removes the temporary known-mismatch exemption and asserts no PPTX profile uses a non-deck renderer.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/deliverables/__tests__/slide-contract.test.ts src/lib/deliverables/profiles/__tests__/registry.test.ts src/lib/deliverables/orchestrator/__tests__/persistence-quality.test.ts src/lib/deliverables/orchestrator/__tests__/surface.test.ts --runInBand` — Pass, 4 suites / 42 tests.
- `rg -n "claude-opus-4-7|claude-opus-4-8|KNOWN_FORMAT_MISMATCHES" src/lib/deliverables src/app/api/programs scripts/moves --glob '!**/__tests__/**' --glob '!**/*.test.ts' --glob '!**/*.spec.ts'` — Pass, no non-test deliverable-path matches.
- `npx eslint src/lib/deliverables/__tests__/slide-contract.test.ts src/lib/deliverables/profiles/registry.ts src/lib/deliverables/orchestrator/generate-service.ts src/lib/deliverables/orchestrator/persistence.ts` — Pass.
- `git diff --check` — Pass.

## Rollout Plan

Merge through pull request. The repo-owned ACA main deploy workflow may build and deploy the resulting image as part of normal main-branch deployment. No data build, migration, registry activation, data-plane write, or tenant source-file mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None in this release.
- Approved image digest: To be recorded by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required only if the workflow deploys this commit.
- Worker image invariant: Required only if the workflow deploys this commit.
- Feature/env flag update path: None.
- Live signed-in proof required: Not required for this metadata-only deliverable profile/routing change; deploy/runtime health is sufficient if deployed.

## Rollback Plan

Revert the pull request. Rollback restores the prior profile renderer declarations and the temporary mismatch allowance in the slide-contract test. No schema or data rollback is needed.

## Audit Evidence

Pull request, local validation output, merge commit, and ACA deploy run if the repo-owned workflow deploys the merge.

## Known Gaps

This release does not create human-authored golden exemplars. The exemplar judge remains dependent on separately authored reference materials.
