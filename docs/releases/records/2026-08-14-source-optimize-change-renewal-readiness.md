# 2026-08-14-source-optimize-change-renewal-readiness — Source Optimize Evidence Alias Readiness

## Release ID

`2026-08-14-source-optimize-change-renewal-readiness`

## Status

`candidate`

## Plain-English Summary

Source Optimize now recognizes governed change-order and renewal-term evidence aliases that already appear in Source evidence packs. This prevents the readiness board from reporting those families as missing when the governed evidence is present under the canonical source names.

## Layer Impact

- `global-control-lane`: shared Source Optimize readiness rules are updated for all tenants using the common optimization evidence model.
- Product projection: the Optimize journey can advance based on governed evidence aliases already in the canonical evidence pack. Missing evidence still remains missing, and no amount is treated as validated unless a calculation run supports it.

## Client Applicability

- All clients: yes, where Source Optimize is enabled.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing Source Optimize availability controls apply.

## Changes Included

- `src/lib/source/data-model/contract-optimization-evidence-readiness.ts`
- `src/lib/source/data-model/__tests__/contract-optimization-evidence-readiness.test.ts`

## QA / Validation

- PASS: `npx jest --runTestsByPath src/lib/source/data-model/__tests__/contract-optimization-evidence-readiness.test.ts --runInBand`
- PASS: `npx eslint src/lib/source/data-model/contract-optimization-evidence-readiness.ts src/lib/source/data-model/__tests__/contract-optimization-evidence-readiness.test.ts`
- PASS: `git diff --check`
- PASS: `npm run release:check`
- NOT RUN: live signed-in browser proof; required after deploy.

## Rollout Plan

Merge through the protected GitHub PR path. The repo-owned Azure Container Apps main deploy workflow builds and deploys the new runtime image after merge.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: produced by the repo-owned ACA workflow.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: unchanged by this release.
- Feature/env flag update path: none.
- Live signed-in proof required: required before claiming the user journey is live-proven.

## Rollback Plan

Revert the PR and redeploy through the same repo-owned ACA workflow. No migration or data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI / local validation: pending.
- ACA deploy run: pending.
- Live proof: pending.

## Known Gaps

Signed-in browser proof remains required before calling the user-facing journey live-proven.
