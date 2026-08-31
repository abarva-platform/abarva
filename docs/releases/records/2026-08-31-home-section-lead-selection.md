# 2026-08-31-home-section-lead-selection — Home Section Lead Selection

## Release ID

`2026-08-31-home-section-lead-selection`

## Status

`candidate`

## Plain-English Summary

This change keeps the strict executive-opening filter for the boardroom thesis, while allowing section-specific technology and exposure evidence to lead sections that are designed to discuss systems, workloads, platforms, and dependencies. It prevents valid technical evidence from being demoted into a deferred section solely because it would be too narrow for the opening thesis.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 Products: updates the `Home` ECL narrative projection writer's story-plan selection logic. It does not change canonical facts, source adapters, schemas, or tenant intake files.

Layer 4 Product QA: extends the `Home` ECL narrative test guard so the story-plan selector preserves the executive-opening bar without applying that bar to every section.

## Client Applicability

- All clients: No.
- Specific clients: Tenants using the Home ECL narrative projection writer.
- Internal only: No.
- Public/demo only: Candidate/demo narrative path until reviewed.
- Feature flag: Existing Home ECL route behavior; no new feature flag.

## Changes Included

- `scripts/ecl/build_home_ecl_narrative_layer.ts`
- `scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`

## QA / Validation

- `npm run test:ecl-home-narrative-layer` — passed locally in a clean worktree.

## Rollout Plan

Merge through GitHub PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the updated image. A governed Home narrative apply job must be run from the deployed digest before the changed story-plan selection affects persisted Home narrative rows.

## Deployment Authority

- Repo-owned deploy workflow: required for shared web/runtime image.
- Shared runtime mutators: none in this change.
- Approved image digest: produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required before claiming deployed runtime.
- Worker image invariant: not changed by this PR.
- Feature/env flag update path: none.
- Live signed-in proof required: required after the governed narrative apply/readback if claiming product proof.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. If narrative rows were regenerated from the reverted logic, rerun the governed Home narrative apply job from the rollback digest and confirm readback.

## Audit Evidence

- Local validation output from `npm run test:ecl-home-narrative-layer`.
- GitHub PR, CI checks, deployment run, ACA runtime invariant, governed narrative apply/readback, and live browser proof after merge.

## Known Gaps

This PR does not regenerate Home narrative rows, polish Home UI layout, or add new source facts. Strategy and leadership sections may still defer when no verified claims exist for those sections.
