# 2026-08-30-source-claim-quality-controls — Source Claim Quality Controls

## Release ID

`2026-08-30-source-claim-quality-controls`

## Status

`candidate`

## Plain-English Summary

Adds compact claim-quality controls to the Source workspace cockpit so executive-facing Source views distinguish computed facts from stale rows and unsupported evidence prose. The page now calls out past-date exclusions, recomputes supplier concentration from contract values, and withholds repeated utilization text unless row-backed entitlement evidence is present.

## Layer Impact

Layer 4 Products, `global-control-lane`: updates the Source workspace projection and executive shell only. No schema, loader, adapter, or tenant data mutation is included.

Layer 3 Canonical Model, no data lane impact: no canonical object changes. Existing contract rows remain the source for renewal and concentration calculations.

## Client Applicability

- All clients: Source workspace users on the shared product runtime.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Source workspace portfolio adapter now emits claim-quality controls for stale renewal rows, computed concentration, and repeated utilization prose.
- Source workspace executive shell renders the controls in the cockpit.
- Focused adapter tests cover stale-date exclusion, lapsed auto-renew exposure, cancellable value, computed concentration, and repeated utilization blocking.

## QA / Validation

- `npx jest --runTestsByPath 'src/lib/source/data-model/__tests__/vendor-contract-portfolio.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' --runInBand` passed: 3 suites, 26 tests.
- `npx eslint 'src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts' 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts'` passed.
- `npm run release:check` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` passed.

## Rollout Plan

Merge through pull request. The repo-owned Azure Container Apps main deploy workflow builds and deploys the exact merged SHA to the shared product runtime.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned deploy workflow.
- ACA runtime invariant: prove after deploy before claiming live.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, verify the Source workspace renders the claim-quality controls without exposing withheld prose as evidence.

## Rollback Plan

Revert the PR and let the repo-owned Azure Container Apps main deploy workflow redeploy the prior Source workspace behavior.

## Audit Evidence

- Focused Jest and ESLint command output from the release branch.
- Pull request, merge commit, ACA deploy run, and signed-in Source workspace proof to be attached after rollout.

## Known Gaps

This release does not load new data, change canonical calculations, or finance-confirm any opportunity. It only hardens what the Source workspace is allowed to show from existing rows.
