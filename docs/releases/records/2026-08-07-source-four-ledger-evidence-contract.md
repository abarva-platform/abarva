# 2026-08-07-source-four-ledger-evidence-contract — Source Four-Ledger Evidence Contract

## Release ID

`2026-08-07-source-four-ledger-evidence-contract`

## Status

`candidate`

## Plain-English Summary

Source Contract 360 now has a shared evidence object for contract optimization. The object keeps recoverable leakage, avoided cost, negotiated improvement, and realized value separate, with source-system references, document references, calculation rules, confidence, review state, workflow state, and Tower claim lineage. If evidence is absent, the product keeps the value unknown instead of rendering zero or inventing savings.

## Layer Impact

- Release lane: `global-control-lane`.
- Source adapters/read models: Contract detail reads can consume per-contract optimization evidence from governed Source V4 feeds when present.
- Products: Contract 360 and Door 1 can use the same four-ledger decision record without tenant-specific branching.
- Tower handoff: Finance-validated realized value remains separate from recoverable or negotiated opportunity.

## Client Applicability

- All clients: Yes, through shared evidence classes and tenant-scoped read paths.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source workspace availability still controls route exposure.

## Changes Included

- Adds the shared contract optimization evidence pack/data contract.
- Extends Contract 360 view construction to carry optional optimization evidence.
- Reads optional Source V4 spend, performance, rate-card, usage, and sourcing evidence for a selected contract.
- Updates the four-ledger decision record to populate each ledger independently when evidence exists.
- Adds focused tests for incomplete evidence, tenant portability, and a fully evidenced canary contract.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/contract-optimization-ledger.test.ts src/lib/source/data-model/__tests__/contract-360-view.test.ts src/lib/source/data-model/__tests__/read-adapter.test.ts --runInBand` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- `npx eslint src/lib/source/data-model/contract-optimization-evidence.ts src/lib/source/data-model/contract-optimization-ledger.ts src/lib/source/data-model/contract-360-view.ts src/lib/source/data-model/read-adapter.ts 'src/app/api/source/workspace/contract/[contractId]/route.ts' src/lib/source/data-model/__tests__/contract-optimization-ledger.test.ts src/lib/source/data-model/__tests__/contract-360-view.test.ts src/lib/source/data-model/__tests__/read-adapter.test.ts` passed.

## Rollout Plan

Merge to main through PR. The repo-owned Azure Container Apps deploy workflow builds and deploys the exact merged image. No database mutation is part of this code release.

## Deployment Authority

- Repo-owned deploy workflow: Required for runtime activation.
- Shared runtime mutators: None in this release.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Verify after deploy.
- Worker image invariant: No worker change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source Contract 360 should still show incomplete ledgers where evidence is absent and populated ledgers where governed evidence exists.

## Rollback Plan

Revert the PR and let the repo-owned ACA deploy workflow restore the prior Contract 360 read path. Because this release does not mutate data, rollback is code-only.

## Audit Evidence

- PR URL after creation.
- CI/deploy run after merge.
- Source Contract 360 signed-in browser proof after deployment.

## Known Gaps

This release creates the shared evidence contract and runtime bridge. It does not itself load a new evidence dataset or promote any synthetic canary data into a live environment.
