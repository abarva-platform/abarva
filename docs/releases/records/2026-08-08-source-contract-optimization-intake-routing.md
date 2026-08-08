# 2026-08-08-source-contract-optimization-intake-routing — Source Contract Optimization Intake Routing

## Release ID

`2026-08-08-source-contract-optimization-intake-routing`

## Status

`candidate`

## Plain-English Summary

Source now routes contract optimization launches through the reviewable intake packet before opening the governed event. When a user starts from Contract 360 or the Source workspace, the selected contract context is visible and the five approval facts are reviewed before submission.

## Layer Impact

Release lane: `global-control-lane`.

Product layer: Source UI routing, intake presentation, and portfolio labels change for the contract optimization flow.

Canonical/data layers: No schema, migration, ingestion, or tenant data mutation is included.

## Client Applicability

- All clients: Yes, for Source users with contract optimization access.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source route availability applies; no new flag is introduced.

## Changes Included

- Contract optimization workspace CTA routes to `/source/new?intent=contract-optimization` with selected contract context.
- Contract 360 and ranked candidate links include scope and owner context when present.
- Contract optimization intake shows a "Loaded from Contract 360" panel and an open minimum approval packet.
- Placeholder values such as pending owner prompts no longer count as captured approval facts.
- Client-facing "Door 1" wording is removed from the touched Source intake and workspace surfaces.

## QA / Validation

- `npx eslint src/components/source/SourceOriginatePage.tsx src/components/source/intake/IntakeCompletionFooter.tsx src/lib/source/intake-intent.ts src/app/'(maestro)'/source/preview/workspace/buildViewModel.ts src/app/'(maestro)'/source/preview/workspace/canvases/ContractCanvas.tsx src/app/'(maestro)'/source/preview/workspace/WorkspaceClient.tsx src/components/source/SourceContract360Page.tsx src/app/'(maestro)'/source/new/page.tsx src/lib/source/portfolio-book-view.ts` passed.
- `npm test -- --runTestsByPath src/components/source/__tests__/SourceOriginatePage.contractOptimization.test.ts src/lib/source/__tests__/intake-intent.test.ts src/app/'(maestro)'/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts src/components/source/__tests__/SourcePortfolioBookPage.honesty.test.tsx` passed with 4 suites and 39 tests. Jest reported existing duplicate manual mock warnings.
- `rg` scan over touched active Source UI files found no retired "Door 1" wording.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- `npm run release:check` passed.
- `npm run integrity:dom` passed with `violations=0`.
- `npm test -- --runInBand` was attempted and did not pass due to unrelated existing broad-suite failures outside the Source contract optimization intake path.

## Rollout Plan

Merge to main through the protected PR flow. The change becomes active on the shared application only after the repo-owned Azure Container Apps main deploy workflow builds and deploys the merged image.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime exposure.
- Shared runtime mutators: None in this release.
- Approved image digest: Produced by the main ACA deploy workflow.
- ACA runtime invariant: Must be checked after deployment.
- Worker image invariant: No worker changes.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the Source contract optimization launch path after deployment.

## Rollback Plan

Revert this release candidate and redeploy the previous approved main image through the ACA main deploy workflow. No database rollback is required.

## Audit Evidence

- PR diff for the release candidate.
- Focused ESLint output.
- Focused Jest output for contract optimization intake, intent, workspace view model, and portfolio badge behavior.
- Release-check output.
- Post-deploy signed-in browser proof for the contract optimization launch path.

## Known Gaps

Full signed-in browser proof is required after deployment before calling the shared runtime live-proven.
