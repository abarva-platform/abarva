# 2026-08-05-moves-pricing-reference-reader — Moves Pricing Reference Pack Reader

## Release ID

`2026-08-05-moves-pricing-reference-reader`

## Status

`candidate`

## Plain-English Summary

Adds a Node/server-side reader that loads the generated global Moves pricing reference CSVs and feeds them into the pure Moves pricing selector. This bridges checked-in reference data to selection logic without loading a database or changing runtime Moves behavior.

## Layer Impact

Layer 3 reference lane: reads derived pricing reference CSV assets from `datasets/reference/pricing-engine-v1`.
Layer 4 product logic lane: exposes helper functions that can select rates for a single request or a role-mix batch. No Moves route, UI, database query or snapshot path is wired.

## Client Applicability

All clients: future Moves runtime wiring can use this reader as the global fallback source.
Specific clients: none.
Internal only: offline/reference validation.
Public/demo only: none.
Feature flag: not applicable.

## Changes Included

- `src/lib/pricing/effort-engine/moves-pricing-reference-pack.ts`
- `src/lib/pricing/effort-engine/__tests__/moves-pricing-reference-pack.test.ts`
- `src/lib/pricing/effort-engine/moves-rate-selection.ts`
- `src/lib/pricing/effort-engine/index.ts`

## QA / Validation

Passed: `npx esbuild src/lib/pricing/effort-engine/moves-pricing-reference-pack.ts --bundle --platform=node --format=cjs --outfile=/tmp/moves-pricing-reference-pack.cjs`.
Passed: compiled Node smoke using the real generated CSVs for onshore healthcare partner pricing, review-required offshore partner pricing, blocked offshore regulated-domain pricing, and internal healthcare scarcity-adjusted cost.
Passed: `npm run validate:pricing-global-rate-card-extension`.

Not run: Jest and the repo TypeScript compiler through the repo toolchain, because this bare checkout has no `node_modules`; Jest cannot load `next` from `jest.config.ts`, and `npx tsc` reports TypeScript is not installed locally.

## Rollout Plan

No runtime rollout. A later PR can call this reader from a server-only Moves estimate execution service after deciding how tenant/deal candidates are loaded and how approved snapshots record the selected-rate provenance.

## Deployment Authority

Repo-owned deploy workflow: not applicable.
Shared runtime mutators: none.
Approved image digest: not applicable.
ACA runtime invariant: no ACA runtime change.
Worker image invariant: no worker image change.
Feature/env flag update path: none.
Live signed-in proof required: not applicable until runtime wiring.

## Rollback Plan

Revert the reader, test file, selector type exports and barrel export. No database or runtime rollback is required.

## Audit Evidence

Inspect the compiled smoke output and tests for real-pack selection coverage: onshore healthcare, offshore review-required partner lane, blocked offshore regulated-domain lane and internal healthcare scarcity-adjusted cost lane.

## Known Gaps

No Moves runtime/API/UI wiring, tenant candidate repository, database load, snapshot migration, margin model, partner buy-rate ingestion or AbarVa sell-rate calculation is included.
