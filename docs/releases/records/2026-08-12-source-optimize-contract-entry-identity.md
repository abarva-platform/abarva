# 2026-08-12-source-optimize-contract-entry-identity — Source Optimize Contract Entry Identity

## Release ID

`2026-08-12-source-optimize-contract-entry-identity`

## Status

`candidate`

## Plain-English Summary

The Source Optimize Contract entry path is now clearer and more distinct from the 11-stage New Sourcing Event journey. Legacy links that request contract optimization through `/source/new` redirect into `/source/optimize`, the direct Optimize page tells the user to select a governed contract first, and selected-contract links use one shared route builder.

## Layer Impact

- `global-control-lane`: Shared Source route and page behavior for all clients using the Optimize Contract entry path.
- `PRODUCTS`: Updates Source navigation, copy, and route tests only.
- `CLIENT INTAKE`: No workbook, template, or upload behavior changes.
- `SOURCE ADAPTERS`: No parser, adapter, or load behavior changes.
- `CANONICAL MODEL`: No schema, canonical facts, tenant data, or data-plane mutation changes.

## Client Applicability

- All clients: Applies to tenants using the shared Source Optimize Contract module.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a shared `buildSourceOptimizeContractHref` helper for contract-optimization module links.
- Redirects `/source/new?intent=contract-optimization` to `/source/optimize` while preserving selected `contractId` and `opportunityId` parameters.
- Updates the Optimize Contract page header, picker copy, and stage labels so the module presents as a focused incumbent-contract path instead of a generic sourcing intake.
- Updates Source Originate candidate links to use the shared Optimize Contract route builder.
- Adds focused route and route-builder tests.

## QA / Validation

- PASS: `NODE_OPTIONS=--max-old-space-size=4096 npx jest --runTestsByPath src/components/source/__tests__/SourceOptimizeContractPage.test.tsx src/components/source/__tests__/SourceOriginatePage.contractOptimization.test.ts src/lib/source/__tests__/optimize-routing.test.ts 'src/app/(maestro)/source/__tests__/new-route-optimization-redirect.test.ts' --runInBand`
- PASS: `NODE_OPTIONS=--max-old-space-size=4096 npx eslint 'src/app/(maestro)/source/new/page.tsx' 'src/components/source/SourceOptimizeContractPage.tsx' 'src/components/source/SourceOriginatePage.tsx' 'src/components/source/__tests__/SourceOptimizeContractPage.test.tsx' 'src/components/source/__tests__/SourceOriginatePage.contractOptimization.test.ts' 'src/lib/source/optimize-routing.ts' 'src/lib/source/__tests__/optimize-routing.test.ts' 'src/app/(maestro)/source/__tests__/new-route-optimization-redirect.test.ts'`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- PASS: `git diff --check`
- NOT-RUN: GitHub PR checks, repo-owned ACA deploy, ACA runtime invariant, and signed-in live browser proof are pending until this candidate is merged and deployed.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the runtime image. No migrations, data jobs, feature flags, or manual Azure runtime mutations are required.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime activation.
- Shared runtime mutators: None in this PR.
- Approved image digest: Resolved by ACA main deploy after merge.
- ACA runtime invariant: Required after deploy before live-proven status.
- Worker image invariant: Standard ACA main deploy verification.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify direct `/source/optimize`, `/source/new?intent=contract-optimization`, and selected-contract navigation.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No data rollback is required because the change is route/UI only.

## Audit Evidence

Candidate PR, GitHub checks, local focused validation outputs, release check output, ACA deploy evidence, and signed-in browser proof after deployment.

## Known Gaps

This release does not complete the deeper Optimize Contract workflow, commercial-baseline persistence, artifact-quality audit, aVa hard QA, PDF/clause parsing, or New Event 11-stage quality hardening. Those remain tracked in the Source execution plan.
