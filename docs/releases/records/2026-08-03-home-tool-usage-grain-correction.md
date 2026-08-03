# 2026-08-03-home-tool-usage-grain-correction — Home Tool Usage Grain Correction

## Release ID

`2026-08-03-home-tool-usage-grain-correction`

## Status

`candidate`

## Plain-English Summary

This release corrects the Home command center so AI tool usage is presented as adoption telemetry, not as a substitute for value proof. The Value Realization view now supports a source-backed tool usage drill and labels active users, seats, cost, graph links, and portfolio choices at the right grain.

## Layer Impact

Release lane: `global-control-lane`.

PRODUCTS: Home presentation and its local read-model projection are updated to label tool usage, architecture relationships, and portfolio choices accurately. No canonical objects, source files, database schema, loaders, tenant records, or Azure jobs are changed.

## Client Applicability

- All clients: No data-plane change.
- Specific clients: None.
- Internal only: No.
- Public/demo only: Authenticated Home command-center demo surface.
- Feature flag: None.

## Changes Included

- Home Value Realization view replaces a generic chart with a source-backed AI tool usage drill.
- Home read model carries tool metadata, source row, and evidence reference into the drill.
- Home architecture labels use `relationships` instead of `flows`.
- Portfolio-choice sidebar copy no longer implies that value claims are initiatives.
- Regression tests cover the double-click tool usage drill and grain labels.

## QA / Validation

- `npx eslint src/components/home/ai-success-command-center/__tests__/AiSuccessCommandCenter.tool-usage.test.tsx src/lib/home/readSkyHarborAiSuccessHome.ts src/components/home/ai-success-command-center/AiSuccessCommandCenter.tsx src/app/\(maestro\)/home/__tests__/home-admin-boundary-contract.test.ts` passed.
- `npm test -- --runTestsByPath src/components/home/ai-success-command-center/__tests__/AiSuccessCommandCenter.tool-usage.test.tsx src/app/\(maestro\)/home/__tests__/home-admin-boundary-contract.test.ts --runInBand` passed: 2 suites, 7 tests.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` passed.
- Local authenticated browser proof requires a valid Clerk session and is not included in this release candidate.

## Rollout Plan

Merge through PR to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the resulting main image. No migration, manual data job, environment flag, or tenant load is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this release.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Required before calling the change live.
- Worker image invariant: No worker image change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for Home Value Realization after deployment.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

- PR diff for Home command center, Home read model, regression tests, and this release record.
- Focused lint and Jest output from the PR validation.
- Post-deploy signed-in Home screenshots and console/network proof when the ACA deployment is complete.

## Known Gaps

This correction does not create new value evidence, dedupe people across tool rows, mutate source data, or replace Tower sparse-state remediation work.
