# 2026-08-07-source-contract-action-story — Contract Optimization Entry Story

## Release ID

`2026-08-07-source-contract-action-story`

## Status

`candidate`

## Plain-English Summary

Source Contract 360 now opens with a compact optimization story instead of requiring users to assemble the decision from multiple tabs. The entry section explains why the contract is worth attention, why timing matters, what evidence supports action, what evidence is missing, and which source-system extracts would close the gaps. Missing evidence remains explicit and does not become a savings estimate.

## Layer Impact

- Lane: `global-control-lane`.
- Products: Source Contract 360 renders a clearer entry story and contract-scoped sourcing guidance.
- Canonical model: No schema or identity changes.
- Source adapters: No loader or adapter changes; the UI consumes the existing governed Contract 360 read model and optimization ledger.

## Client Applicability

- All clients: Yes, this is tenant-agnostic Source product behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source preview route behavior.

## Changes Included

- `src/lib/source/data-model/contract-optimization-spine.ts`
- `src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts`
- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`
- `src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx`

## QA / Validation

- `npx jest src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts src/lib/source/data-model/__tests__/contract-optimization-ledger.test.ts --runInBand` passed.
- `npx eslint src/lib/source/data-model/contract-optimization-spine.ts src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts src/app/'(maestro)'/source/preview/workspace/buildViewModel.ts src/app/'(maestro)'/source/preview/workspace/canvases/ContractCanvas.tsx` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and shifts the production/lab web runtime after merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this change.
- Approved image digest: Set by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify the Source Contract 360 overview and optimization tab on `app.abarva.ai`.

## Rollback Plan

Revert the PR. There is no migration, seed, or tenant data mutation to roll back.

## Audit Evidence

- Candidate branch/PR.
- Local test, lint, and typecheck output.
- Post-merge ACA deployment evidence.
- Signed-in Source Contract 360 browser proof after deploy.

## Known Gaps

- This does not create new evidence data or quantify value where the governed ledger says evidence is missing.
- The page still uses the existing header and route-level layout; separate visual density polish remains a backlog item.
