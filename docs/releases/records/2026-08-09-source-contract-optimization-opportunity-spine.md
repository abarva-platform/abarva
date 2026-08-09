# 2026-08-09-source-contract-optimization-opportunity-spine — Source Contract Optimization Opportunity Spine

## Release ID

`2026-08-09-source-contract-optimization-opportunity-spine`

## Status

`candidate`

## Plain-English Summary

Source Contract 360 now reads contract optimization as a set of governed commercial opportunities instead of one contract-level four-ledger summary. A contract can show a validated invoice-line rate-variance opportunity, quantified or approval-required adjacent opportunities, Finance-confirmed realization as a linked maturity state, and a blocked baseline conflict when the commercial evidence does not reconcile.

## Layer Impact

- Release lane: `global-control-lane`
- Canonical model: Adds a tenant-scoped opportunity spine migration for optimization opportunities, evidence, calculations, requirements, cases, approvals, outcomes, and Finance realization.
- Products: Updates Source Contract 360 and the Optimize launch path to carry selected opportunity identity into the Door 1 workflow.
- Source adapters: Reads existing Source golden-contract evidence tables and contract PDF extraction tables into a governed opportunity read model.
- Client intake: No intake template changes in this release.

## Client Applicability

- All clients: Yes, as a shared Source product capability and schema contract.
- Specific clients: None in product logic.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `supabase/migrations/20260809143000_source_contract_optimization_opportunity_spine.sql`
- `src/lib/source/data-model/contract-optimization-opportunity.ts`
- `src/lib/source/data-model/read-adapter.ts`
- `src/lib/source/data-model/contract-360-view.ts`
- `src/app/api/source/workspace/contract/[contractId]/route.ts`
- `src/app/api/source/workspace/contract/[contractId]/optimization/route.ts`
- `src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx`
- `src/app/(maestro)/source/preview/workspace/viewModel.tsx`
- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`
- `src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx`
- Focused tests under `src/lib/source/data-model/__tests__/` and `src/app/api/source/workspace/contract/[contractId]/optimization/__tests__/`.

## QA / Validation

- `NODE_OPTIONS=--max-old-space-size=8192 /Users/anand/Projects/nexus/node_modules/.bin/tsc --noEmit --pretty false` — passed.
- `/Users/anand/Projects/nexus/node_modules/.bin/eslint ...` over touched Source data-model, API, VM, and canvas files — passed.
- `/Users/anand/Projects/nexus/node_modules/.bin/jest --runTestsByPath ... --runInBand` for Source workspace, ledger, spine, opportunity, and optimization route tests — passed, with pre-existing duplicate manual mock warnings.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the app image. The migration must be applied through the approved data-plane migration path before relying on the new physical opportunity tables in production workflows. The UI read model can render from existing governed Source evidence tables while the physical spine is introduced.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the deploy workflow after merge.
- ACA runtime invariant: Verify after deploy.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify Contract 360 and Optimize launch for the governed Source tenant after deploy.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA workflow. If the migration has already been applied, leave additive tables in place until a DBA-approved rollback window; the product read path does not require dropping them.

## Audit Evidence

- Pull request and merge commit.
- TypeScript, ESLint, and Jest output from this release candidate.
- Post-deploy signed-in browser proof for Source Contract 360, selected opportunity identity, Optimize launch, and blocked baseline contrast.

## Known Gaps

The release does not load additional tenant evidence, implement every future opportunity detector, or declare every contract ready for optimization. Browser proof and live data reconciliation are required after merge/deploy before calling the product path demo-ready.
