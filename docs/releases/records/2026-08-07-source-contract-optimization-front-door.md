# 2026-08-07-source-contract-optimization-front-door — Source Contract Optimization Front Door

## Release ID

`2026-08-07-source-contract-optimization-front-door`

## Status

`candidate`

## Plain-English Summary

The Source "Optimize a contract" entry path now behaves like an incumbent-contract optimization workflow instead of a generic new sourcing intake. If no contract is selected, the page first shows ranked governed contract candidates and blocks event creation. If a user launches from Contract 360, the intake is prefilled from the selected contract and submits through the contract-bound optimization API.

## Layer Impact

- `global-control-lane`: Shared Source workflow behavior for all clients using the contract optimization entry path.
- `PRODUCTS`: Updates the Source UI entry path and submit routing for Door 1 contract optimization.
- `CANONICAL MODEL`: Read-only consumption of governed Source contract rows for ranking; no canonical schema or data mutation changes.

## Client Applicability

- All clients: Applies to any tenant using the shared Source contract optimization entry path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `/source/new?intent=contract-optimization` loads ranked contract candidates from governed Source contract rows.
- `SourceOriginatePage` blocks contract optimization event creation until a contract is selected.
- Contract 360 optimize links carry selected-contract value context into the prefilled intake.
- Selected-contract submit uses the contract-bound optimization API instead of the generic event-creation API.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/lib/source/__tests__/intake-intent.test.ts src/components/source/__tests__/SourceOriginatePage.contractOptimization.test.ts src/components/source/__tests__/SourceContract360Page.test.tsx src/app/'(maestro)'/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts --runInBand`
- PASS: `npx eslint src/app/'(maestro)'/source/new/page.tsx src/components/source/SourceOriginatePage.tsx src/components/source/SourceContract360Page.tsx src/components/source/__tests__/SourceOriginatePage.contractOptimization.test.ts src/components/source/__tests__/SourceContract360Page.test.tsx src/lib/source/__tests__/intake-intent.test.ts`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the runtime image. No migrations, no feature flags, and no manual data job are required.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Resolved by ACA main deploy after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Standard ACA main deploy verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify `/source/new?intent=contract-optimization` and a Contract 360 optimize launch.

## Rollback Plan

Revert the PR. The previous generic intake and existing contract-bound API remain available; no data rollback is required.

## Audit Evidence

- Candidate PR and CI checks.
- Focused Jest, ESLint, and TypeScript outputs listed above.
- Post-merge ACA deploy evidence and signed-in browser proof.

## Known Gaps

This change does not redesign the full post-approval Door 1 canvas. It fixes the front-door routing and contract-selection invariant.
