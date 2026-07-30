# 2026-07-30-foundation-v2-golden-slice-substrate - Foundation V2 Golden Slice Substrate

## Release ID

`2026-07-30-foundation-v2-golden-slice-substrate`

## Status

`draft`

## Plain-English Summary

Adds an isolated Foundation V2 proof substrate for a golden-slice implementation. The change creates V2-only tables, validation scripts, and proof ledgers used to test the approved architecture without replacing live governed records or product providers.

## Layer Impact

Release lane: `client-data-lane` with `internal-admin` proof tooling only.

Layer 1 and Layer 2: Adds typed source release, file, row, field, parser, evidence and disposition contracts for isolated test execution.

Layer 3: Adds typed normalized object, candidate, review and canonical object contracts for the golden slice.

Layer 4: Adds isolated publication, baseline, projection, Cube parity, preview product binding and aVa proof contracts. These are preview/test proof objects only.

Cross-cutting governance: Adds V1 reuse/repair/replacement policy records, implementation ledgers, package validation and migration safety tests.

## Client Applicability

- All clients: No live client/provider behavior changes.
- Specific clients: None.
- Internal only: Foundation V2 implementation and lab proof operators.
- Public/demo only: None.
- Feature flag: Not applicable; tables are isolated by schema, tenant key, test namespace and RLS.

## Changes Included

- `supabase/migrations/20260730120000_foundation_v2_golden_slice_core.sql`
- `scripts/foundation-v2/validate-approved-package.mjs`
- `scripts/foundation-v2/__tests__/run-validate-approved-package-tests.mjs`
- `scripts/foundation-v2/__tests__/run-golden-slice-migration-tests.mjs`
- `docs/architecture/foundation-v2/FOUNDATION_V2_GOLDEN_SLICE_PHYSICAL_CONTRACTS.md`
- `proof/foundation-v2-implementation-20260730/*`
- `package.json` test scripts

## QA / Validation

- `npm run test:foundation-v2-package` - passed.
- Approved package validation with explicit architecture and checkpoint SHA-256 inputs - passed.
- `npm run test:foundation-v2-migration` - passed.
- `npm run test:foundation-v2-migration:apply` - passed against a temporary local PostgreSQL cluster.
- `npm run test:foundation-v2-golden-slice` - passed.
- `npm run release:check` - passed.
- `npx eslint ...` - not run successfully because this clean worktree does not have `eslint` installed in `node_modules`.

## Rollout Plan

Open a scoped PR. After independent GPT review and required checks, merge through the normal PR path. Lab migration application, if performed, must use the governed private operator path and only the V2-only schema from this release.

## Deployment Authority

- Repo-owned deploy workflow: Required for any shared web runtime deploy.
- Shared runtime mutators: None in this change.
- Approved image digest: Not yet applicable.
- ACA runtime invariant: Required before claiming any lab deployment is live.
- Worker image invariant: Required before any VNet job proof claim.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this substrate alone; required later for preview/test product proof.

## Rollback Plan

Code rollback: revert the PR.

Migration rollback in lab: remove only the isolated `foundation_v2` schema after confirming no approved proof bundle depends on it. Do not touch V1 governed source releases, review ledgers, canonical objects, publications, baselines, projections, Cube objects or product providers.

## Audit Evidence

- Implementation ledger: `proof/foundation-v2-implementation-20260730/FOUNDATION_V2_IMPLEMENTATION_LEDGER.md`
- Package validation proof: `proof/foundation-v2-implementation-20260730/foundation-v2-approved-package-validation.json`
- Migration safety test output from `npm run test:foundation-v2-migration`
- Future PR, CI, merge, lab deployment and VNet job references.

## Known Gaps

Full reload, live publication, replacement baseline activation, provider cutover, product activation and production aVa activation remain explicitly out of scope and require separate human approval.
