# 2026-07-01-source-contract-optimization-mve — Source existing-contract optimization MVE

## Release ID

`2026-07-01-source-contract-optimization-mve`

## Status

`candidate`

## Plain-English Summary

Adds the first Source slice for analyzing and optimizing an existing large
outsourcing contract. The change defines a minimum viable extraction profile,
structured findings, and negotiation levers so Source can support renewal,
renegotiation, rebid, and optimization decisions without becoming a generic
document browser.

## Layer Impact

- `global-control-lane`: shared Source code and standards for all tenants.
- `client-data-lane`: non-destructive Azure/Postgres migration adds typed
  tenant-scoped contract optimization tables.

## Client Applicability

- All clients: capability and schema are shared.
- Specific clients: the included SkyHarbor pack is synthetic demo evidence only.
- Internal only: none.
- Public/demo only: synthetic pack is for demo/proof only.
- Feature flag: not yet wired to a live default UI path.

## Changes Included

- Contract optimization MVE model:
  `src/lib/source/contract-optimization/*`
- Structured persistence row mapper:
  `src/lib/source/contract-optimization/persistence.ts`
- Structured persistence migration:
  `supabase/migrations/20260701120000_source_contract_optimization_mve.sql`
- Synthetic evidence pack:
  `datasets/source/contract-optimization/skyharbor-ams-renewal-2026/*`
- Product standard:
  `docs/source/SOURCE_EXISTING_CONTRACT_OPTIMIZATION_MVE_STANDARD.md`

## QA / Validation

- PASS: focused Jest for the new contract optimization module (4/4):
  `npx jest src/lib/source/contract-optimization/__tests__/contract-optimization-mve.test.ts --runInBand`
- PASS: focused ESLint for touched Source contract optimization files:
  `npx eslint src/lib/source/contract-optimization/**/*.ts`
- PASS: targeted TypeScript compile for new contract optimization files:
  `npx tsc --noEmit --pretty false --target ES2017 --lib dom,dom.iterable,esnext --module esnext --moduleResolution bundler --strict --esModuleInterop --skipLibCheck --types jest src/lib/source/contract-optimization/types.ts src/lib/source/contract-optimization/mve-profile.ts src/lib/source/contract-optimization/index.ts src/lib/source/contract-optimization/__tests__/contract-optimization-mve.test.ts`
- PASS: release check:
  `npm run release:check`
- PASS: architecture rules:
  `npm run audit:architecture-rules`
- BLOCKED: full-repo TypeScript with large heap reached existing dependency
  declaration gaps outside this slice (`js-yaml`,
  `@azure-rest/ai-document-intelligence`, `@axe-core/playwright`).

## Rollout Plan

Merge through PR, apply the migration through the approved Azure/Postgres path,
then wire a future Source route/UI slice to read the structured profile. No live
runtime behavior changes until that route/UI wiring lands.

## Deployment Authority

- Repo-owned deploy workflow: required for future UI/runtime wiring.
- Shared runtime mutators: none in this slice.
- Approved image digest: not applicable yet.
- ACA runtime invariant: not applicable until runtime wiring.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: required before claiming the capability live.

## Rollback Plan

Code rollback by reverting the PR. The migration is additive and non-destructive;
if needed, stop writing to the new tables and leave them inert until an approved
schema cleanup is scheduled.

## Audit Evidence

- Focused tests and release check from this branch.
- Migration file and product standard.
- Synthetic evidence pack with `synthetic_demo` labeling.

## Known Gaps

- UI route and aVa answer wiring are intentionally out of scope for this first
  slice.
- Live data-plane migration has not been applied in this branch.
- DOCX/PDF optimization brief export is a follow-up slice.
