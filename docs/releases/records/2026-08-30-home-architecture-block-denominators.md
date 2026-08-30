# 2026-08-30-home-architecture-block-denominators — Home Architecture Block Denominators

## Release ID

`2026-08-30-home-architecture-block-denominators`

## Status

`candidate`

## Plain-English Summary

Home's current-state architecture block details now keep source-to-target movement counts separate from data, BI, ETL, report, script, and analytics workload segments. This closes a second display path where a combined evidence-family count could be labeled as pure movement volume.

## Layer Impact

- Layer 4 PRODUCTS / `global-control-lane`: updates the Home architecture block detail and system-passport count labels.
- No Layer 1 CLIENT INTAKE, Layer 2 SOURCE ADAPTERS, Layer 3 CANONICAL MODEL, ECL schema, Azure data, or route default changes are included.

## Client Applicability

- All clients: yes, for users viewing Home current-state architecture block details.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Selected architecture block details count only source-to-target rows as data movements.
- System-passport details count only source-to-target rows as touching data movements.
- Workload segment counts render separately when the governed projection provides workload evidence.
- Focused architecture regression coverage asserts that workload rows cannot inflate block-level movement wording.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/components/home/v4/__tests__/ArchitecturePage.grain.test.tsx --runInBand`
- PASS: `npx eslint src/components/home/v4/ArchitecturePage.tsx src/components/home/v4/__tests__/ArchitecturePage.grain.test.tsx`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pending: `npm run release:check`

## Rollout Plan

Merge through PR, then deploy through the repo-owned Azure Container Apps main deploy workflow. No manual data-plane or runtime mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: required for production/lab rollout.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: pending workflow output after merge.
- ACA runtime invariant: pending workflow output after merge.
- Worker image invariant: pending workflow output after merge.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, verify the Home architecture surface no longer labels workload segments as data movements.

## Rollback Plan

Revert the PR. No schema, data-plane, or migration rollback is required.

## Audit Evidence

- PR URL and CI checks.
- ACA main deploy workflow run after merge.
- Signed-in Home architecture browser proof after deployment.

## Known Gaps

This release fixes block-level denominator language only. It does not regenerate Home chapter prose or change the underlying ECL data load.
