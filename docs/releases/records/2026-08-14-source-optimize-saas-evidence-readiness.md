# 2026-08-14-source-optimize-saas-evidence-readiness — Source Optimize SaaS Evidence Readiness

## Release ID

`2026-08-14-source-optimize-saas-evidence-readiness`

## Status

`candidate`

## Plain-English Summary

Optimize Contract evidence readiness now recognizes governed SaaS and platform usage evidence as the demand-volume input for a SaaS renewal optimization case. This prevents a contract with real monthly usage and entitlement evidence from being blocked by a managed-services-only staffing requirement, while preserving missing-evidence behavior for contracts that do not have governed evidence.

## Layer Impact

- Release lane: `global-control-lane`.
- Canonical model: no schema or data mutation. The change interprets existing governed evidence references through the shared evidence family registry.
- Products: Source Optimize Contract and Source contract aVa grounding consume the same readiness builder, so the workflow rail and aVa context use the updated evidence-family behavior.

## Client Applicability

- All clients: applies to any tenant using Source Optimize Contract with governed SaaS/platform usage evidence.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/data-model/contract-optimization-evidence-readiness.ts`
- `src/lib/source/contract-evidence/templates.ts`
- Focused unit coverage for evidence readiness and evidence-template selection.

## QA / Validation

- `npx jest --runTestsByPath src/lib/source/data-model/__tests__/contract-optimization-evidence-readiness.test.ts src/lib/source/contract-evidence/__tests__/templates.test.ts src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts --runInBand` — passed, 23 tests.
- `npx eslint src/lib/source/data-model/contract-optimization-evidence-readiness.ts src/lib/source/contract-evidence/templates.ts src/lib/source/data-model/__tests__/contract-optimization-evidence-readiness.test.ts src/lib/source/contract-evidence/__tests__/templates.test.ts` — passed.
- Browser/live proof is required after deployment before this release is marked live-proven.

## Rollout Plan

Merge to main and deploy through the repo-owned Azure Container Apps workflow. No migration, private operator job, feature flag, or manual data load is required.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: assigned by the repo-owned workflow after merge.
- ACA runtime invariant: required before claiming deployment live.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, verify the Optimize rail for a contract with governed SaaS usage evidence.

## Rollback Plan

Revert the PR and redeploy through the repo-owned workflow. Since no database state changes are made, rollback is code-only.

## Audit Evidence

- PR URL after opening.
- GitHub deploy workflow run after merge.
- ACA runtime invariant after deploy.
- Signed-in Source Optimize Contract browser proof after deploy.

## Known Gaps

- This does not build the negotiation strategy or approval substrate. It only fixes the readiness classification for governed SaaS/platform usage evidence.
