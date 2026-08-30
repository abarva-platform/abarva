# 2026-08-30-home-page-prompt-contract-gates — Home Page Prompt Contract Gates

## Release ID

`2026-08-30-home-page-prompt-contract-gates`

## Status

`candidate`

## Plain-English Summary

This release tightens the Home V2 prompt contract so every Home surface has a named page prompt, writer lens, required context, source-layer reads, required visible content, and forbidden failure modes. It also passes those page prompt contracts into the Home narrative packet as model instructions, and adds tests that fail when the contract omits a Home surface or lets data/architecture pages ask for evidence that is already loaded in the governed packet.

## Layer Impact

Layer 4, Products: Home prompt and narrative quality contracts are clarified, made testable, and included in the future Home narrative generation packet. No runtime route, database schema, source data, or Azure data-plane state changes are included.

Layer 3, Canonical model: No canonical data changes.

## Client Applicability

- All clients: Future Home V2 prompt generation and QA contract.
- Specific clients: None.
- Internal only: No.
- Public/demo only: Current synthetic demo surfaces.
- Feature flag: No flag change.

## Changes Included

- Extends the Home V2 page prompt contract from 12 to 16 Home surfaces.
- Adds prompt contracts for Applications & Systems, Vendor Contracts, Infrastructure & Platforms, and Data Assets & Integrations.
- Passes the prompt contract into the Home narrative packet so Claude receives page-specific writer lenses, required context, source-layer reads, must-show obligations, and forbidden failure modes.
- Updates the thesis prompt to treat page prompt contracts as page instructions, not citable tenant evidence.
- Replaces the narrative quality wording that allowed a chapter to disappear with a strict published/refused/deferred terminal-state rule.
- Extends the Home ECL narrative test to parse the prompt contract and assert the required writer lenses, shared packet sections, source-family gates, D&A workload gates, interview surface, and browse/slice-dice contract.

## QA / Validation

Run before merge:

- PASS — `node -e "JSON.parse(require('fs').readFileSync('docs/architecture/home-v2-page-prompt-contracts-2026-08-30.json','utf8')); console.log('json ok')"`
- PASS — `npm run test:ecl-home-narrative-layer`
- PASS — `npm run release:check`

## Rollout Plan

Merge to `main` by PR. No Azure data-build, route repoint, feature flag, or manual deployment is required for this prompt-contract and generation-packet update.

## Deployment Authority

- Repo-owned deploy workflow: Not required.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this doc/test-only slice.

## Rollback Plan

Revert the PR if the prompt contract needs to be replaced. No data rollback is required.

## Audit Evidence

- PR URL and CI results after publication.
- Test output from `npm run test:ecl-home-narrative-layer`.
- Release check output from `npm run release:check`.

## Known Gaps

This release does not regenerate Home content, reload Azure data, redesign the visible UI, or claim browser proof. It makes the Home V2 page prompt contract complete, test-enforced, and available to the future Home narrative generation call.
