# 2026-08-08-source-contract-scope-prefill-hotfix — Source Contract Scope Prefill Hotfix

## Release ID

`2026-08-08-source-contract-scope-prefill-hotfix`

## Status

`candidate`

## Plain-English Summary

This hotfix prevents generic synthetic contract scope text from being promoted into Source's contract optimization approval packet. The intake still carries governed contract identity, vendor, annual value, actual spend, weak-leverage count, and decision owner, but scope only counts as captured when a reviewable scope boundary is present.

## Layer Impact

Release lane: `global-control-lane`.

Products: Source Contract 360, the optimization cockpit launch URL, and the contract optimization intake now suppress non-reviewable scope fallback text.

Canonical Model: no schema, migration, tenant data, or calculation changes.

## Client Applicability

All clients: yes, for Source contract optimization intake behavior.

Specific clients: none.

Internal only: no.

Public/demo only: no.

Feature flag: no new flag.

## Changes Included

- Shared contract optimization intake guards in `src/lib/source/contract-optimization-intake.ts`.
- Source intake scope prefill and loaded-context panel behavior.
- Contract 360 and workspace optimization URLs omit non-reviewable scope.
- Regression coverage for synthetic fallback scope not counting as captured approval scope.

## QA / Validation

Current validation status:

- Focused ESLint on changed Source files: pass.
- Focused Jest for SourceOriginatePage, SourceContract360Page, and Source workspace view model: pass.
- TypeScript `npx tsc --noEmit`: pass.
- Runtime wording scan for the synthetic fallback phrase in active Source intake/workspace files: pass, zero matches.
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

Revert the PR and allow the ACA main deploy workflow to deploy the prior Source intake behavior. No data rollback is required.

## Audit Evidence

Inspect the PR, CI checks, ACA main deploy run, and signed-in Source CTR-061/CTR-090 proof after deployment.

## Known Gaps

The underlying source projection may still carry weak or synthetic scope rows. This hotfix prevents them from becoming approval facts; a separate data-quality pass should replace those rows with governed scope boundaries when available.
