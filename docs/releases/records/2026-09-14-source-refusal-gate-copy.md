# 2026-09-14-source-refusal-gate-copy - Source Contract 360 refusal-gate copy

## Release ID

`2026-09-14-source-refusal-gate-copy`

## Status

`candidate`

## Plain-English Summary

The inactive Optimize gate badge now says `No refusal gate` instead of `Clear`. This makes clear that the contract has no active governance refusal; it does not imply that evidence collection or workflow readiness is complete.

## Layer Impact

`global-control-lane`: presentation-only copy in the Source Contract 360 Optimize surface. No canonical model, loader, schema, or data-plane mutation.

## Client Applicability

- All clients: all Source Contract 360 users
- Specific clients: none
- Internal only: no
- Public/demo only: no
- Feature flag: none

## Changes Included

- Optimize refusal-gate badge copy and behavior test.
- No migrations, loaders, routes, or data model changes.

## QA / Validation

- PASS: focused Contract Optimize Jest suite, 7 tests.
- PASS: ESLint on changed TypeScript and test files.
- PASS: `git diff --check`.
- PASS: `npm run release:check`.
- Pending: CI and signed-in browser proof after merge.

## Rollout Plan

Merge through the protected `main` branch and deploy through the repo-owned Azure Container Apps workflow. No migration or manual data build is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change
- Approved image digest: assigned by the deploy workflow
- ACA runtime invariant: required before calling the change live
- Worker image invariant: unchanged, still checked by the deploy workflow
- Feature/env flag update path: none
- Live signed-in proof required: yes, Optimize tab and the surrounding evidence gate

## Rollback Plan

Revert the change through a protected PR and redeploy with the repo-owned ACA workflow. No data rollback is required.

## Audit Evidence

- PR and CI checks for this release.
- Focused Contract Optimize test output.
- Post-deploy signed-in screenshot or browser readback of the Optimize gate state.

## Known Gaps

The portfolio Levers and Contract 360 Optimize value read paths still require reconciliation before their figures can be treated as interchangeable in a demo.
