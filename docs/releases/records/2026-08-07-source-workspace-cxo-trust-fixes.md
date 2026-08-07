# 2026-08-07-source-workspace-cxo-trust-fixes — Source Workspace CXO Trust Fixes

## Release ID

`2026-08-07-source-workspace-cxo-trust-fixes`

## Status

`candidate`

## Plain-English Summary

The Source workspace now avoids two client-facing trust breaks: Vendor 360 no longer shows a contract count that conflicts with the visible material-contract table, and Contract 360 now distinguishes governed register facts from document-extraction facts. The Explore tab also opens with a clearer business purpose and only shows category-quality warnings when category is actually part of the analysis.

## Layer Impact

Lane: `global-control-lane`.

Products: Source workspace presentation and view-model copy are updated. The change does not mutate tenant data, source adapters, canonical data, cubes, or workflow state.

## Client Applicability

- All clients: Yes, wherever the Source workspace preview is enabled.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source workspace access controls apply.

## Changes Included

- Vendor 360 headline and stats use the count of visible material contract rows, with any separate rollup family count labeled separately.
- Contract 360 Evidence tab explains that Overview/Renewal values come from `source.contract_360`, while document rows come from `doc.extraction`.
- Contract 360 changes "No value extracted" to "No document value extracted" for extraction gaps.
- Door 1 CTA wording is normalized to "Door 1 optimization".
- Explore tab now opens with a decision-oriented description and hides category-quality warning banners unless category is in the active group/filter path.
- Data tables use max-content width plus horizontal overflow to reduce compressed right-side columns at desktop widths.

## QA / Validation

- Pass: `/Users/anand/Projects/nexus/node_modules/.bin/jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' --runInBand` (14 tests passed).
- Pass: `/Users/anand/Projects/nexus/node_modules/.bin/eslint 'src/app/(maestro)/source/preview/workspace/**/*.{ts,tsx}'`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 /Users/anand/Projects/nexus/node_modules/.bin/tsc --noEmit --pretty false`.
- Pending: `npm run release:check`.
- Pending: Signed-in browser verification after deployment.

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None.
- Approved image digest: To be captured by the deployment workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Standard workflow invariant only; no worker changes.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, Source workspace Explore, Vendor 360, Contract 360 Evidence, and Door 1 CTA copy.

## Rollback Plan

Revert the PR or roll back to the previous ACA revision digest. No data rollback is required.

## Audit Evidence

- PR URL and merge commit.
- Focused workspace regression test output.
- ESLint, TypeScript, and release-check output.
- ACA deployment evidence.
- Signed-in browser proof on Source workspace.

## Known Gaps

This release does not build a new bubble/scatter leverage chart. It fixes the immediate trust, language, and selection-clarity issues identified in the CXO walkthrough.
