# 2026-08-08-source-contract-optimization-copy-hotfix — Source Contract Optimization Copy Hotfix

## Release ID

`2026-08-08-source-contract-optimization-copy-hotfix`

## Status

`candidate`

## Plain-English Summary

This hotfix removes retired internal workflow wording from Source contract optimization runtime copy. Contract 360 and related optimization surfaces now describe the experience as contract optimization, evidence collection, approval, and value proof without exposing internal step names to users.

## Layer Impact

Release lane: `global-control-lane`.

Products: Source UI copy and API error text are normalized for the existing contract optimization path.

Canonical Model: no schema, migration, tenant data, or calculation changes.

## Client Applicability

All clients: yes, for Source contract optimization copy.

Specific clients: none.

Internal only: no.

Public/demo only: no.

Feature flag: no new flag.

## Changes Included

- Runtime copy in `src/lib/source/data-model/contract-optimization-ledger.ts`.
- Runtime copy in `src/lib/source/data-model/contract-optimization-spine.ts`.
- Contract optimization API error text in Source routes.
- Regression coverage in the Source workspace view-model test.

## QA / Validation

Current validation status:

- Focused ESLint on changed Source files: pass.
- Focused Jest for the Source workspace view model: pass.
- Runtime wording scan over active Source contract optimization files: pass, zero matches for retired workflow wording.
- `npm run release:check`: pass.
- Signed-in live Source proof after ACA main deploy: pending.

## Rollout Plan

Merge to `main` by PR. The repo-owned ACA main deploy workflow builds and deploys the updated image to the shared app runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the workflow
- Approved image digest: resolved by the workflow after merge
- ACA runtime invariant: verified by the workflow after deploy
- Worker image invariant: verified by the workflow after deploy
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Revert the PR and allow the ACA main deploy workflow to deploy the previous copy path. No data rollback is required.

## Audit Evidence

Inspect the PR, CI checks, ACA main deploy run, and signed-in Source Contract 360 proof after deployment.

## Known Gaps

Internal module names and historical design/release records still use older vocabulary where they describe implementation history. This hotfix only removes active runtime/user-facing copy.
