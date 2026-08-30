# 2026-08-30-home-architecture-denominator-language — Home Architecture Denominator Language

## Release ID

`2026-08-30-home-architecture-denominator-language`

## Status

`candidate`

## Plain-English Summary

Home's architecture wheel now separates source-to-target data movements from data, BI, ETL, report, script, and analytics workload segments. This prevents a combined evidence-family count from being mistaken for pure movement volume.

## Layer Impact

- Layer 4 PRODUCTS / `global-control-lane`: updates the Home current-state architecture surface copy and count presentation.
- No Layer 1 CLIENT INTAKE, Layer 2 SOURCE ADAPTERS, Layer 3 CANONICAL MODEL, ECL schema, Azure data, or route default changes are included.

## Client Applicability

- All clients: yes, for users viewing the Home current-state architecture surface.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Home architecture wheel count labels now render data movements and workload segments as separate denominators.
- Focused architecture regression coverage asserts that adding workload rows does not inflate the displayed movement count.

## QA / Validation

- PASS: `npm test -- --runTestsByPath src/components/home/v4/__tests__/ArchitecturePage.grain.test.tsx --runInBand`
- PASS: `npx eslint src/components/home/v4/ArchitecturePage.tsx src/components/home/v4/__tests__/ArchitecturePage.grain.test.tsx`
- PASS: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`

## Rollout Plan

Merge through PR, then deploy through the repo-owned Azure Container Apps main deploy workflow. No manual data-plane or runtime mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: required for production/lab rollout.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: pending workflow output after merge.
- ACA runtime invariant: pending workflow output after merge.
- Worker image invariant: pending workflow output after merge.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, verify the Home architecture wheel shows separate movement and workload-segment denominators.

## Rollback Plan

Revert the PR. No schema, data-plane, or migration rollback is required.

## Audit Evidence

- PR URL and CI checks.
- ACA main deploy workflow run after merge.
- Signed-in Home architecture browser proof after deployment.

## Known Gaps

This release fixes denominator language only. It does not regenerate Home chapter prose or change the underlying ECL data load.
