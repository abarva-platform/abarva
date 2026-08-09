# 2026-08-09-source-contract-optimization-opportunity-spine — Source Contract Optimization Opportunity Spine

## Release ID

`2026-08-09-source-contract-optimization-opportunity-spine`

## Status

`candidate`

## Plain-English Summary

Source Contract 360 now reads contract optimization as a set of governed commercial opportunities instead of one contract-level four-ledger summary. A contract can show a validated invoice-line rate-variance opportunity, quantified or approval-required adjacent opportunities, Finance-confirmed realization as a linked maturity state, and a blocked baseline conflict when the commercial evidence does not reconcile.

This candidate also adds the canonical fact assertion/conflict layer that sits between source extracts and product surfaces. Contract 360, Door 1, Tower handoff, and aVa should consume resolved/persisted opportunity facts rather than recalculating or quoting ad hoc totals from raw source extracts.

The follow-up UI hardening keeps the same shared capability honest in presentation: conflicted or not-sized opportunity sets render as `Not sized` / `Not established`, not `$0`, and Postgres numeric strings from the contract performance summary are coerced at the read-adapter boundary before UI formatting.

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
- `scripts/source/apply-contract-optimization-source-schema.ts`
- `scripts/source/project-contract-optimization-spine.ts`
- `src/lib/source/data-model/contract-optimization-facts.ts`
- `src/lib/source/data-model/__tests__/contract-optimization-facts.test.ts`
- `src/lib/source/data-model/contract-optimization-opportunity.ts`
- `src/lib/source/data-model/read-adapter.ts`
- `src/lib/source/data-model/__tests__/read-adapter.test.ts`
- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`
- `src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts`
- `src/lib/source/data-model/__tests__/contract-optimization-opportunity.test.ts`
- `package.json`

## QA / Validation

- `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false --incremental false` — passed.
- `./node_modules/.bin/eslint scripts/source/project-contract-optimization-spine.ts src/lib/source/data-model/read-adapter.ts src/lib/source/data-model/contract-optimization-facts.ts src/lib/source/data-model/contract-optimization-opportunity.ts src/lib/source/data-model/__tests__/contract-optimization-facts.test.ts src/lib/source/data-model/__tests__/contract-optimization-opportunity.test.ts` — passed.
- `NODE_OPTIONS='' ./node_modules/.bin/jest src/lib/source/data-model/__tests__/contract-optimization-facts.test.ts src/lib/source/data-model/__tests__/contract-optimization-opportunity.test.ts src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts src/lib/source/data-model/__tests__/contract-optimization-ledger.test.ts src/lib/source/data-model/__tests__/contract-optimization-portability.test.ts --runInBand` — passed, with pre-existing duplicate manual mock warnings.
- `npm run source:contract-optimization:spine:plan -- --contract-id <canary contracts>` — blocked before query by local DNS resolution for the configured lab PostgreSQL hostname. No rows were inserted.
- `npm run source:contract-optimization:schema:plan` — added after live migration execution was blocked by an unrelated tenant migration hash drift. The plan prints the exact three Source DDL files and combined hash and does not connect to the database or mutate `schema_migrations`.
- `./node_modules/.bin/eslint src/lib/source/data-model/contract-optimization-facts.ts src/lib/source/data-model/__tests__/contract-optimization-facts.test.ts` — passed after hardening fact assertion confidence coercion.
- `NODE_OPTIONS='' ./node_modules/.bin/jest src/lib/source/data-model/__tests__/contract-optimization-facts.test.ts src/lib/source/data-model/__tests__/contract-optimization-opportunity.test.ts src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts src/lib/source/data-model/__tests__/contract-optimization-ledger.test.ts src/lib/source/data-model/__tests__/contract-optimization-portability.test.ts --runInBand` — passed after adding a regression test that prevents non-numeric confidence descriptors from reaching the canonical fact assertion table.
- Source schema operator apply — passed through the approved operator path for the scoped Source schema set; emitted a structured `source_contract_optimization_source_schema_applied` event with three migrations applied and all required tables present.
- Source opportunity/fact projection — passed through the approved operator path after confidence coercion hardening; emitted a structured `source_contract_optimization_spine_projected` event with persisted opportunity, evidence, calculation, assertion, and conflict rows for the scoped canary contracts.
- `NODE_OPTIONS='' ./node_modules/.bin/jest --runTestsByPath "src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts" src/lib/source/data-model/__tests__/read-adapter.test.ts --runInBand` — passed, with pre-existing duplicate manual mock warnings. Covers conflicted opportunities rendering as `Not sized`/`Not established` instead of `$0`, and contract performance numeric strings being coerced to numbers.
- `./node_modules/.bin/eslint "src/app/(maestro)/source/preview/workspace/buildViewModel.ts" "src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts" src/lib/source/data-model/read-adapter.ts src/lib/source/data-model/__tests__/read-adapter.test.ts` — passed.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps main deploy workflow builds and deploys the app image. The migration and projection are applied through the approved data-plane operator job path before relying on the new physical opportunity/fact tables in production workflows. The normal global migration runner is the preferred path, but the focused Source schema apply is allowed when unrelated migration-ledger drift would otherwise require touching another tenant lane. The read adapter remains backward-compatible by falling back to existing governed Source evidence tables when the persisted spine is not present.

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
- Source schema-apply operator proof bundle after the approved operator job runs.
- Golden evidence load proof bundle already emitted by the approved operator job for the scoped canary contracts.
- Post-deploy signed-in browser proof for Source Contract 360, selected opportunity identity, Optimize launch, fact-conflict refusal behavior, and second-tenant portability smoke test.

## Known Gaps

The release does not implement every future opportunity detector or declare every contract ready for optimization. A normal migration attempt was blocked by unrelated tenant migration hash drift; this release does not repair or re-record that other tenant's migration ledger. The second-tenant path is intentionally the same projection/read-model path with different tenant inputs; no tenant-specific product fork is included.
