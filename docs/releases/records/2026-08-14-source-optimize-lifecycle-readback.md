# 2026-08-14-source-optimize-lifecycle-readback — Source Optimize Lifecycle Readback

## Release ID

`2026-08-14-source-optimize-lifecycle-readback`

## Status

`candidate`

## Plain-English Summary

Source Optimize now reads and reports the persisted lifecycle records that sit after opportunity diagnosis: optimization case, approval requests, approval decisions, negotiated outcomes, and finance realization counts. This makes downstream workflow state auditable through the same governed Source read path instead of leaving those rows invisible to product and operator proof.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source read adapters now project existing persisted lifecycle records for contract optimization. The change does not create, rewrite, or reinterpret canonical source facts.
- Operations proof: The contract-optimization spine readback script now reports lifecycle coverage alongside baseline, opportunity, calculation-run, and finance-realization coverage.

## Client Applicability

- All clients: applies to any tenant with Source Optimize persisted spine tables.
- Specific clients: none.
- Internal only: operator readback script output is internal proof.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/data-model/contract-optimization-opportunity.ts`
- `src/lib/source/data-model/read-adapter.ts`
- `scripts/source/readback-contract-optimization-spine.ts`
- `src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts`

## QA / Validation

- Pass: `./node_modules/.bin/eslint src/lib/source/data-model/contract-optimization-opportunity.ts src/lib/source/data-model/read-adapter.ts scripts/source/readback-contract-optimization-spine.ts src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts`
- Pass: `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/read-adapter.contract-optimization.test.ts src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts --runInBand`
- Pass: `npx tsc --noEmit`
- Pass: `git diff --check`
- Pending: `npm run release:check` will be rerun after this release record update.

## Rollout Plan

Merge to `main` by PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the web image. After deployment, run the existing ACA operator readback job for the Source contract-optimization spine and verify the lifecycle section in the structured proof event.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: to be captured after deploy.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: not changed by this release.
- Feature/env flag update path: none.
- Live signed-in proof required: required before claiming UI behavior; operator readback is sufficient only for lifecycle data proof.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No schema or data rollback is required because this release only reads existing tables and extends proof output.

## Audit Evidence

- Pull request URL.
- Focused lint, Jest, TypeScript, release-check output.
- ACA deploy run and runtime invariant.
- ACA operator readback bundle showing lifecycle counts for sampled contracts.

## Known Gaps

- This release does not create approval requests, approval decisions, negotiated outcomes, or finance confirmations.
- This release does not claim steps after evidence read are fully browser-proven.
- Missing downstream lifecycle rows must remain missing until the workflow creates or receives governed evidence for them.
