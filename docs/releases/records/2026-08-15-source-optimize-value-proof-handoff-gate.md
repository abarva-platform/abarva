# 2026-08-15-source-optimize-value-proof-handoff-gate — Source Optimize Value Proof Handoff Gate

## Release ID

`2026-08-15-source-optimize-value-proof-handoff-gate`

## Status

`candidate`

## Plain-English Summary

Source Optimize now keeps the final value-proof step open when finance-confirmed value exists but the Finance/Tower handoff request has not been recorded. This prevents the workflow rail from implying that value proof is complete before the audit handoff exists.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: updates the Source Optimize workflow projection and its tests. No canonical data, loaders, migrations, or tenant records change.

## Client Applicability

- All clients: yes, for the shared Source Optimize workflow.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/data-model/contract-optimization-workflow-step.ts`
- `src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts`
- `src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`

## QA / Validation

- `npx jest src/components/source/__tests__/SourceOptimizeContractPage.test.tsx src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts src/lib/source/data-model/__tests__/contract-optimization-workflow-actions.test.ts 'src/app/api/source/optimize/contract/[contractId]/workflow/__tests__/route.test.ts' --runInBand` — passed, 39 tests.
- `npx eslint src/lib/source/data-model/contract-optimization-workflow-step.ts src/lib/source/data-model/__tests__/contract-optimization-workflow-step.test.ts src/components/source/__tests__/SourceOptimizeContractPage.test.tsx` — passed.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false` — passed.
- `npm run release:check` — passed.
- `git diff --check` — passed.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the shared web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the main deploy workflow after merge.
- ACA runtime invariant: required after deploy before claiming live.
- Worker image invariant: required after deploy before claiming live.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the Source Optimize rail when browser control is available.

## Rollback Plan

Revert this PR to restore the previous rail completion rule.

## Audit Evidence

- PR URL: to be added after PR creation.
- Local focused Jest and ESLint output in the Codex task log.
- Post-merge ACA deploy artifact and runtime-invariant proof required before live claim.

## Known Gaps

- This release changes the workflow-completion invariant only. It does not add new Finance/Tower realization data, new upload parsing, or a browser proof workaround for local Chrome/display automation.
