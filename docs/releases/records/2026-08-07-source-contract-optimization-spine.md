# 2026-08-07-source-contract-optimization-spine — Source Contract Optimization Spine

## Release ID

`2026-08-07-source-contract-optimization-spine`

## Status

`candidate`

## Plain-English Summary

Adds a shared Source decision spine for contract optimization. Contract 360 now explains why a selected contract is or is not a good optimization candidate, shows the top optimization queue, maps the four value ledgers to real enterprise source systems, and keeps missing evidence explicit instead of converting unknown value to zero.

## Layer Impact

- Lane: `global-control-lane`.
- Canonical/read-model consumption: no schema change. The new model consumes existing Source contract rows, leverage signals, renewal exposure, and the four-ledger optimization evidence object.
- Product projection: Source Contract 360 gains a ranked optimization-fit panel and a source-system evidence map.
- Intake/template guidance: contract evidence templates now name specific system families and the columns each extract should map from.

## Client Applicability

- All clients: yes, as a shared Source product capability.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added.

## Changes Included

- `src/lib/source/data-model/contract-optimization-spine.ts`
- `src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts`
- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`
- `src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx`
- `src/lib/source/contract-evidence/templates.ts`

## QA / Validation

- `npx jest src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts src/lib/source/data-model/__tests__/contract-optimization-ledger.test.ts src/lib/source/data-model/__tests__/sourcing-opportunities.test.ts --runInBand` passed.
- `npx eslint src/lib/source/data-model/contract-optimization-spine.ts src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts src/app/'(maestro)'/source/preview/workspace/buildViewModel.ts src/app/'(maestro)'/source/preview/workspace/canvases/ContractCanvas.tsx src/lib/source/contract-evidence/templates.ts` passed.
- `npx tsc --noEmit --pretty false` passed.
- Local authenticated browser proof was attempted through the development server, but the route redirected to Clerk sign-in. Signed-in Source browser proof is required after deploy.

## Rollout Plan

Merge to main through pull request. The repo-owned Azure Container Apps deploy workflow builds and deploys the main image. After deployment, run signed-in Source workspace proof against the contract optimization tab and overview tab.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this change.
- Approved image digest: produced by the deploy workflow.
- ACA runtime invariant: verify after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR. No migration rollback is required because this is a read-model and UI projection change only.

## Audit Evidence

- PR URL after creation.
- Test/lint/typecheck outputs listed above.
- ACA deploy workflow output after merge.
- Signed-in Source workspace screenshots or DOM proof after deploy.

## Known Gaps

- This does not seed additional invoice, SLA, usage, or finance-value data. Missing evidence remains visible until a governed data-build job loads richer evidence.
- This does not change Door 1 workflow stages or approval policy.
