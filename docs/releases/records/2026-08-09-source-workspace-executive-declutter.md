# 2026-08-09-source-workspace-executive-declutter — Source Workspace Executive Declutter

## Release ID

`2026-08-09-source-workspace-executive-declutter`

## Status

`candidate`

## Plain-English Summary

This release tightens the Source workspace and contract detail presentation so the page reads as an executive decision surface instead of an implementation diagnostic. The always-visible workspace banner now shows only client-facing status, contract relationship copy uses plain commercial language, currency values render compactly, evidence trace labels use plain opportunity terms, opportunity evidence is separated from finance-confirmed outcome language, and dynamic evidence notes are normalized before they reach Contract 360 or Source aVa.

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection layer: Updates the Source workspace UI copy, header chrome, relationship map labels, and compact currency formatting.
- Agent context layer: Updates Source workspace aVa context strings and dynamic evidence-note strings so chat uses the same opportunity-evidence vocabulary as the page.
- Canonical data layer: No schema, migration, loader, or tenant-data changes.

## Client Applicability

- All clients: Applies to tenants using the Source workspace route.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx`
- `src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx`
- `src/app/(maestro)/source/preview/workspace/canvases/EvidenceLineageGraph.tsx`
- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts`
- `src/lib/source/data-model/contract-optimization-ledger.ts`
- `src/lib/source/data-model/contract-optimization-opportunity.ts`

## QA / Validation

- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/viewModel.explore.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/workspace-ava-contract.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' --runInBand` — passed, 4 suites / 30 tests.
- `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/workspace-ava-contract.test.ts' --runInBand` — passed, 3 suites / 26 tests, including a regression for stale dynamic opportunity-note wording.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx' 'src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx' 'src/app/(maestro)/source/preview/workspace/canvases/EvidenceLineageGraph.tsx' 'src/app/(maestro)/source/preview/workspace/buildViewModel.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts'` — passed.
- `rg -n "Recoverable leakage|Realized value|Value proof|value proof|value ledger|Value ledgers|Four-ledger|ledger above|Source-system facts|SOURCE FACTS|realized value|recoverable leakage" 'src/app/(maestro)/source/preview/workspace'` — passed with no remaining Source workspace matches.
- `NODE_OPTIONS=--max-old-space-size=8192 /Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node ./node_modules/typescript/bin/tsc --noEmit --pretty false` — passed.

## Rollout Plan

Merge through the protected GitHub PR lane. The repo-owned Azure Container Apps deploy workflow builds the image from the merged main SHA and shifts shared web traffic after the revision is healthy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Verify template image, latest revision image, and 100% traffic revision image match after deployment.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source workspace route and selected contract detail tabs.

## Rollback Plan

Revert the PR and allow the repo-owned deploy workflow to redeploy the prior Source workspace presentation. No data rollback is required.

## Audit Evidence

- PR URL and merge commit after publication.
- Focused Source workspace Jest output.
- ESLint and TypeScript output.
- ACA deploy workflow run and post-deploy runtime invariant.
- Signed-in browser smoke evidence for the Source workspace route.

## Known Gaps

Browser proof must be captured after the deploy reaches the live ACA revision. This release does not change data completeness, evidence extraction, or optimization calculations.
