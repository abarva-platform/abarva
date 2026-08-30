# 2026-08-30-home-claude-lens-contract — Home Claude Lens Contract

## Release ID

`2026-08-30-home-claude-lens-contract`

## Status

`candidate`

## Plain-English Summary

This release makes the Home V2 page-prompt contract more explicit about how generated narrative
must change by page. It adds role contracts for the executive, business-strategy, technology,
data, finance, interview, sourcing, transformation, and source-review lenses so the Home writer
can use the same governed facts while adopting the right decision frame for each surface.

## Layer Impact

Layer 4, Products. Release lane: `global-control-lane`.

Home prompt contracts and prompt-contract tests are tightened.

Layer 3, Canonical model: No canonical data changes.

Layer 1/2, Client intake and adapters: No source data or adapter changes.

## Client Applicability

- All clients: Future Home V2 narrative generation and QA contract.
- Specific clients: None.
- Internal only: No.
- Public/demo only: Current synthetic demo surfaces.
- Feature flag: No flag change.

## Changes Included

- Adds `lens_contracts` to the Home V2 page prompt contract.
- Defines each lens with audience, prompt instruction, evidence priority, style, and forbidden
  failure modes.
- Adds a role prompt pattern to the Home V2 deterministic-content design.
- Extends the Home ECL narrative contract test so role contracts are complete and key lenses remain
  distinct.

## QA / Validation

Run before merge:

- PASS — `npm run test:ecl-home-narrative-layer`
- PASS — JSON parse and lens-count smoke for `docs/architecture/home-v2-page-prompt-contracts-2026-08-30.json`

`npm run release:check` is expected before merge and is recorded by the PR.

## Rollout Plan

Merge to `main` by PR. This is a prompt-contract and test hardening slice only. It does not mutate
Azure data, repoint routes, regenerate Home content, or deploy the web runtime.

## Deployment Authority

- Repo-owned deploy workflow: Not required.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this doc/test-only slice.

## Rollback Plan

Revert the PR if the lens contract needs to be replaced. No data rollback is required.

## Audit Evidence

- PR URL and CI results after publication.
- Test output from `npm run test:ecl-home-narrative-layer`.
- Release check output from `npm run release:check`.

## Known Gaps

This release does not regenerate or publish new Home narrative. It makes the prompt contract sharper
so the next Home narrative generation run can be evaluated against page-specific writer lenses.
