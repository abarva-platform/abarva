# 2026-08-10-source-optimize-contract-module-entry — Source Optimize Contract Entry

## Release ID

`2026-08-10-source-optimize-contract-module-entry`

## Status

`candidate`

## Plain-English Summary

Source now treats incumbent contract optimization as its own Source module entry point instead of routing users through the generic new sourcing-event intake. Portfolio, Contract 360, and workspace optimization actions send users to `/source/optimize`, where they first choose or review a governed contract and then open the contract-specific optimization case.

## Layer Impact

- Lane: `global-control-lane`, because this is shared Source product navigation and workflow entry behavior.
- Product projection layer: Source navigation and Contract 360 actions now point to the dedicated Optimize Contract module.
- Canonical model layer: No schema or fact semantics changed. The module reads the existing governed contract, opportunity, evidence, and ledger projections.
- Workflow layer: The existing contract-specific optimization API remains the case-opening backend after the user confirms the selected contract/opportunity.

## Client Applicability

- All clients: Any tenant with governed Source contract projections receives the dedicated Optimize Contract entry point.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- New Source route: `/source/optimize`.
- New Source component: `SourceOptimizeContractPage`.
- Contract 360 optimization CTA now links by governed contract ID only.
- Source book optimization CTA now opens the Optimize Contract module.
- Workspace optimization actions now open the Optimize Contract module instead of the generic new event intake.
- Legacy `/source/new?intent=contract-optimization` requests redirect to `/source/optimize`.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/components/source/__tests__/SourceContract360Page.test.tsx src/components/source/__tests__/SourcePortfolioBookPage.honesty.test.tsx src/components/source/__tests__/SourceOriginatePage.contractOptimization.test.ts src/components/source/__tests__/SourceOptimizeContractPage.test.tsx 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' --runInBand` — 5 suites, 35 tests passed. Existing duplicate manual mock warnings were emitted by Jest.
- Pass: `npx eslint src/components/source/SourceOptimizeContractPage.tsx 'src/app/(maestro)/source/optimize/page.tsx' 'src/app/(maestro)/source/new/page.tsx' src/components/source/SourceContract360Page.tsx src/components/source/SourcePortfolioBookPage.tsx src/components/source/SourceOriginatePage.tsx 'src/app/(maestro)/source/preview/workspace/buildViewModel.ts' src/components/source/__tests__/SourceOptimizeContractPage.test.tsx src/components/source/__tests__/SourceOriginatePage.contractOptimization.test.ts src/components/source/__tests__/SourceContract360Page.test.tsx src/components/source/__tests__/SourcePortfolioBookPage.honesty.test.tsx 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts'`.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Pass: `npm run release:check`.
- Pass: `npm run build`. Build emitted existing broad-file-trace warnings from admin/pricing paths; `/source/optimize` was present in the generated route table.
- Pass: `npm run bundle:budget`.
- PR, deploy, and live signed-in proof are still pending.

## Rollout Plan

Merge to main through the GitHub PR path. The repo-owned Azure Container Apps main deploy workflow builds and deploys the production image. After deploy, verify the live Source navigation and Optimize Contract route with a signed-in browser session.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this change.
- Approved image digest: To be produced by the main deploy workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: No worker change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy main through the repo-owned ACA workflow. No migration rollback is required because this release does not alter database schema or data.

## Audit Evidence

- PR URL: pending.
- Focused Jest output: 5 suites / 35 tests passed.
- ESLint output: passed.
- TypeScript output: passed with explicit heap setting.
- Release check output: passed.
- Build output: passed.
- Bundle budget output: passed.
- ACA deployment proof: pending.
- Live signed-in browser proof: pending.

## Known Gaps

- This release creates the dedicated module entry point and routing contract. It does not complete the full Optimize Contract case workspace redesign, artifact-quality audit automation, aVa hard-question benchmark, or all 11-stage New Event journey improvements.
