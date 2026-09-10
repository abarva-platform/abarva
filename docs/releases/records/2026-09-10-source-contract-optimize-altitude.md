# 2026-09-10-source-contract-optimize-altitude — Source Contract Optimize Altitude

## Release ID

`2026-09-10-source-contract-optimize-altitude`

## Status

`candidate`

## Plain-English Summary

Source now keeps portfolio-level Optimize and selected-contract Optimize at separate altitudes. The portfolio Levers page stays a queue of governed actions across the contract book, while a selected contract's Optimize tab renders only that contract's levers, sequence, comparator evidence, and governed tab-specific contract intelligence.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3/4 read model: adds `source.contract_tab_intelligence_v1`, a deterministic projection over existing contract, scope, evidence-coverage, and action-candidate rows.
- Layer 4 PRODUCTS: updates Source workspace rendering and browser-surface tests so Contract 360 tab openers prefer governed tab intelligence before render-time fallbacks.
- Tenant records: no tenant data is inserted, deleted, or manually mutated by this PR.

## Client Applicability

- All clients: applies to the shared Source workspace UI.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Source selected-contract Optimize now has contract-specific subtabs for levers, sequencing, and comparator evidence.
- Contract detail now carries seven tab-intelligence rows when the Layer 4 projection is refreshed: Story, Scope, Economics, Performance, Relationship, Evidence, and Optimize.
- Contract 360 tab openers use the governed tab row's headline, allowed executive statement, evidence summary, blocker, review state, and provenance.
- Portfolio Optimize no longer receives or renders a synthetic selected contract.
- The old portfolio evidence-basis side panel is removed from the portfolio Levers page because it implied contract-specific evidence where the page is actually portfolio-level.
- Empty states now explain the missing governed input instead of leaving contract Optimize subtabs blank.
- Source command layout lets the right-side decision queue span the grid so the left-side narrative can continue without a large visual gap.

## QA / Validation

- `./node_modules/.bin/jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand` — PASS, 7 tests.
- `./node_modules/.bin/jest --runTestsByPath 'src/app/api/source/workspace/contract/[contractId]/__tests__/route.test.ts' --runInBand` — PASS, 8 tests.
- `./node_modules/.bin/jest --runTestsByPath src/lib/source/data-model/__tests__/read-adapter.test.ts --runInBand` — PASS, 13 tests.
- `./node_modules/.bin/jest --runTestsByPath scripts/source/__tests__/project-contract-depth-package-layer4.test.ts --runInBand` — PASS, 8 tests.
- `./node_modules/.bin/eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' 'src/app/api/source/workspace/contract/[contractId]/route.ts' 'src/app/api/source/workspace/contract/[contractId]/__tests__/route.test.ts' src/lib/source/data-model/read-adapter.ts src/lib/source/data-model/types.ts src/lib/source/data-model/contract-360-view.ts scripts/source/project-contract-depth-package-layer4.ts scripts/source/__tests__/project-contract-depth-package-layer4.test.ts` — PASS.
- `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false` — PASS.
- `git diff --check` — PASS.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned Azure Container Apps main deploy workflow should build and deploy the resulting `main` image. Refresh the governed Source Layer 4 projection through the approved ACA data-build job before claiming `source.contract_tab_intelligence_v1` is live for a tenant.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout.
- Shared runtime mutators: none in this release.
- Approved image digest: assigned by the main deploy workflow after merge.
- ACA runtime invariant: verify after deployment before claiming live.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for Source workspace portfolio Levers and selected-contract Optimize.

## Rollback Plan

Revert the pull request and let the repo-owned ACA main deploy workflow publish the reverted image. Drop or stop reading `source.contract_tab_intelligence_v1` by reverting the migration/projection change if the data projection causes issues. No tenant source rows require rollback.

## Audit Evidence

- Pull request and merge commit for this release.
- Focused Source workspace browser-surface test output.
- ESLint, TypeScript, diff-check, and release-check output.
- Post-deploy Source workspace signed-in smoke proof once merged and deployed.

## Known Gaps

- This release creates the governed tab-intelligence projection, but it does not itself reparse source documents, add missing archetype mappings, or load new evidence rows.
- Discount benchmarks remain governed data-layer work; the tab-intelligence projection refuses to invent market comparables, rates, or derived savings.
