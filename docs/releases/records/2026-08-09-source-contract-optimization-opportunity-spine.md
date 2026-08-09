# 2026-08-09-source-contract-optimization-opportunity-spine — Source Contract Optimization Opportunity Spine

## Release ID

`2026-08-09-source-contract-optimization-opportunity-spine`

## Status

`candidate`

## Plain-English Summary

Source Contract 360 now reads contract optimization as a set of governed commercial opportunities instead of one contract-level four-ledger summary. A contract can show a validated invoice-line rate-variance opportunity, quantified or approval-required adjacent opportunities, Finance-confirmed realization as a linked maturity state, and a blocked baseline conflict when the commercial evidence does not reconcile.

This candidate also adds the canonical fact assertion/conflict layer that sits between source extracts and product surfaces. Contract 360, Door 1, Tower handoff, and aVa should consume resolved/persisted opportunity facts rather than recalculating or quoting ad hoc totals from raw source extracts.

## Layer Impact

- Release lane: `global-control-lane`
- Canonical model: Adds tenant-scoped fact assertion/conflict tables beside the opportunity spine for source snapshots, evidence-to-entity links, canonical fact assertions, and detected fact conflicts.
- Products: Updates the Source Contract 360 read adapter so it prefers persisted governed opportunity, evidence, calculation, requirement, and Finance realization rows when present, with the existing evidence-builder path retained as a fallback.
- Source adapters: Adds a projection script that reads existing Source golden-contract evidence tables and contract PDF extraction tables into the governed opportunity and fact layers.
- Client intake: No intake template changes in this release.

## Client Applicability

- All clients: Yes, as a shared Source product capability and schema contract.
- Specific clients: None in product logic.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `supabase/migrations/20260809161500_source_contract_optimization_fact_assertions.sql`
- `scripts/source/project-contract-optimization-spine.ts`
- `src/lib/source/data-model/contract-optimization-facts.ts`
- `src/lib/source/data-model/__tests__/contract-optimization-facts.test.ts`
- `src/lib/source/data-model/contract-optimization-opportunity.ts`
- `src/lib/source/data-model/read-adapter.ts`
- `src/lib/source/data-model/__tests__/contract-optimization-opportunity.test.ts`
- `package.json`

## QA / Validation

- `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false --incremental false` — passed.
- `./node_modules/.bin/eslint scripts/source/project-contract-optimization-spine.ts src/lib/source/data-model/read-adapter.ts src/lib/source/data-model/contract-optimization-facts.ts src/lib/source/data-model/contract-optimization-opportunity.ts src/lib/source/data-model/__tests__/contract-optimization-facts.test.ts src/lib/source/data-model/__tests__/contract-optimization-opportunity.test.ts` — passed.
- `NODE_OPTIONS='' ./node_modules/.bin/jest src/lib/source/data-model/__tests__/contract-optimization-facts.test.ts src/lib/source/data-model/__tests__/contract-optimization-opportunity.test.ts src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts src/lib/source/data-model/__tests__/contract-optimization-ledger.test.ts src/lib/source/data-model/__tests__/contract-optimization-portability.test.ts --runInBand` — passed, with pre-existing duplicate manual mock warnings.
- `npm run source:contract-optimization:spine:plan -- --contract-id <canary contracts>` — blocked before query by local DNS resolution for the configured lab PostgreSQL hostname. No rows were inserted.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the app image. The migration and projection must be applied through the approved data-plane migration/job path before relying on the new physical opportunity/fact tables in production workflows. The read adapter remains backward-compatible by falling back to existing governed Source evidence tables when the persisted spine is not present.

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
- Data-build proof bundle after the approved projection job runs.
- Post-deploy signed-in browser proof for Source Contract 360, selected opportunity identity, Optimize launch, fact-conflict refusal behavior, and second-tenant portability smoke test.

## Known Gaps

The release does not load additional tenant evidence, implement every future opportunity detector, or declare every contract ready for optimization. Browser proof, live data reconciliation, and the approved data-build job are required after merge/deploy before calling the product path demo-ready. The second-tenant path is intentionally the same projection/read-model path with different tenant inputs; no tenant-specific product fork is included.
