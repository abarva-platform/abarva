# 2026-08-30-home-multi-lens-content-contract — Home Multi-Lens Content Contract

## Release ID

`2026-08-30-home-multi-lens-content-contract`

## Status

`candidate`

## Plain-English Summary

Adds a Home V2 design and prompt contract that defines how each Home page receives governed ECL
context, which executive lens the model writer must use, what source and layer inputs are allowed,
and what proof is required before content is considered publishable.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4 — Products: documents the Home page packet, page prompt, visual dataset, and rendered
  claim rules. No runtime behavior changes in this release.
- Governance/docs: records the multi-lens content contract so Home pages can be rebuilt against a
  shared page-by-page design rather than ad hoc prose or screenshots.

## Client Applicability

- All clients: conceptually applicable to future Home builds.
- Specific clients: the initial target is the synthetic Meridian-style demo package.
- Internal only: no.
- Public/demo only: no runtime public route change in this release.
- Feature flag: none.

## Changes Included

- Adds `docs/architecture/home-v2-multi-lens-deterministic-content-contract-2026-08-30.md`.
- Adds `docs/architecture/home-v2-page-prompt-contracts-2026-08-30.json`.

## QA / Validation

- Documentation-only change. Validated by repository diff review.
- `npm run release:check` should pass before merge.

## Rollout Plan

Merge to `main`. No ACA deploy or data-plane mutation is required for this documentation release.

## Deployment Authority

- Repo-owned deploy workflow: not required for this documentation-only release.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the documentation commit if the contract is superseded.

## Audit Evidence

- PR diff.
- `npm run release:check` output.

## Known Gaps

- This release does not implement the Home packet compiler, UI, model writer, visual datasets, or
  browser proof. It defines the target contract for those implementation slices.
