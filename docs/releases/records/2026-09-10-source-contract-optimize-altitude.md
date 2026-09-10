# 2026-09-10-source-contract-optimize-altitude — Source Contract Optimize Altitude

## Release ID

`2026-09-10-source-contract-optimize-altitude`

## Status

`candidate`

## Plain-English Summary

Source now keeps portfolio-level Optimize and selected-contract Optimize at separate altitudes. The portfolio Levers page stays a queue of governed actions across the contract book, while a selected contract's Optimize tab renders only that contract's levers, sequence, and comparator evidence.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 PRODUCTS: updates Source workspace rendering and browser-surface tests only. No canonical data, loader, schema, or tenant records change.

## Client Applicability

- All clients: applies to the shared Source workspace UI.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Source selected-contract Optimize now has contract-specific subtabs for levers, sequencing, and comparator evidence.
- Portfolio Optimize no longer receives or renders a synthetic selected contract.
- The old portfolio evidence-basis side panel is removed from the portfolio Levers page because it implied contract-specific evidence where the page is actually portfolio-level.
- Empty states now explain the missing governed input instead of leaving contract Optimize subtabs blank.
- Source command layout lets the right-side decision queue span the grid so the left-side narrative can continue without a large visual gap.

## QA / Validation

- `./node_modules/.bin/jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand` — PASS, 7 tests.
- `./node_modules/.bin/eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx'` — PASS.
- `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false` — PASS.
- `git diff --check` — PASS.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned Azure Container Apps main deploy workflow should build and deploy the resulting `main` image. No manual runtime mutation, migration, data-build job, or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout.
- Shared runtime mutators: none in this release.
- Approved image digest: assigned by the main deploy workflow after merge.
- ACA runtime invariant: verify after deployment before claiming live.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for Source workspace portfolio Levers and selected-contract Optimize.

## Rollback Plan

Revert the pull request and let the repo-owned ACA main deploy workflow publish the reverted image. No data rollback is required.

## Audit Evidence

- Pull request and merge commit for this release.
- Focused Source workspace browser-surface test output.
- ESLint, TypeScript, diff-check, and release-check output.
- Post-deploy Source workspace signed-in smoke proof once merged and deployed.

## Known Gaps

- This release does not enrich contract data, add archetype mappings, or load new evidence rows. It only prevents portfolio and selected-contract Optimize surfaces from mixing their stories.
- Discount benchmarks and contract-derived narrative intelligence remain governed data-layer work, not render-time inference.
