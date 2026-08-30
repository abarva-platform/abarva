# 2026-08-30-home-chapter-writer-lens-contract — Home Chapter Writer Lens Contract

## Release ID

`2026-08-30-home-chapter-writer-lens-contract`

## Status

`candidate`

## Plain-English Summary

This release wires the Home V2 chapter writer to use the page prompt and lens contracts carried in
the governed Home packet. The chapter writer now prefers the packet's page label, decision question,
audience, role instruction, evidence priority, style, and forbidden behaviors instead of relying
only on older hardcoded lens strings.

## Layer Impact

Layer 4, Products. Release lane: `global-control-lane`.

Home narrative generation uses the richer page-level prompt contract when constructing Claude
chapter prompts.

Layer 3, Canonical model: No canonical data changes.

Layer 1/2, Client intake and adapters: No source data or adapter changes.

## Client Applicability

- All clients: Future Home V2 narrative generation.
- Specific clients: None.
- Internal only: No.
- Public/demo only: Current synthetic demo surfaces.
- Feature flag: No flag change.

## Changes Included

- Resolves `lens_contracts` from the Home V2 page prompt contract and attaches the matching role
  contract to each page prompt row in the generated packet.
- Updates the chapter writer so Claude receives hat, audience, instruction, evidence priority,
  style, and must-not-do guidance from the packet.
- Keeps existing hardcoded chapter lens text as fallback only.
- Extends the Home ECL narrative test to assert the packet and chapter writer use the role
  contracts.

## QA / Validation

Run before merge:

- PASS — `npm run test:ecl-home-narrative-layer`
- PASS — `npx eslint scripts/ecl/build_home_ecl_narrative_layer.ts scripts/data-build/build-home-chapters.ts scripts/ecl/__tests__/run-home-ecl-narrative-layer-tests.mjs`

`npm run release:check` is expected before merge and is recorded by the PR.

## Rollout Plan

Merge to `main` by PR. This changes the future Home narrative generation path. It does not itself
mutate Azure data, regenerate Home content, repoint routes, or deploy the web runtime.

## Deployment Authority

- Repo-owned deploy workflow: Not required for this slice.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this code/test-only generation-path slice.

## Rollback Plan

Revert the PR to make the chapter writer fall back to the previous hardcoded lens strings. No data
rollback is required.

## Audit Evidence

- PR URL and CI results after publication.
- Test output from `npm run test:ecl-home-narrative-layer`.
- ESLint output for changed script/test files.
- Release check output from `npm run release:check`.

## Known Gaps

This release does not regenerate or publish new Home narrative. The next data-build slice must run
the Home narrative job against the updated packet contract, read it back, and browser-review the
resulting Home pages before claiming CXO-ready content.
