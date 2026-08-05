# 2026-08-05-moves-pricing-selection-bridge — Moves Pricing Selection Bridge

## Release ID

`2026-08-05-moves-pricing-selection-bridge`

## Status

`candidate`

## Plain-English Summary

Adds a pure Moves pricing selector that can choose the correct rate candidate for a role, level, technology, location, provider and commercial model. It preserves the required precedence order: deal override, tenant contracted rate, tenant internal rate, industry overlay, then global reference.

## Layer Impact

Layer 4 product logic lane: adds a pure pricing selection module under the pricing effort engine. It is not wired to any Moves route, UI, database query or snapshot approval path in this candidate.
Layer 3 reference lane: consumes the global pricing extension shape through adapter functions, but does not load or mutate reference data.

## Client Applicability

All clients: future Moves pricing can use this selector after separate runtime wiring.
Specific clients: none.
Internal only: selector tests and validation.
Public/demo only: none.
Feature flag: not applicable.

## Changes Included

- `src/lib/pricing/effort-engine/moves-rate-selection.ts`
- `src/lib/pricing/effort-engine/__tests__/moves-rate-selection.test.ts`
- `src/lib/pricing/effort-engine/index.ts`

## QA / Validation

Passed: `npx esbuild src/lib/pricing/effort-engine/moves-rate-selection.ts --bundle --platform=node --format=cjs --outfile=/tmp/moves-rate-selection.cjs`.
Passed: compiled Node smoke proving deal override wins over tenant contracted and global reference candidates.
Passed: `npm run validate:pricing-global-rate-card-extension`.
Passed: `npm run release:check`.

Not run: Jest and TypeScript compiler through the repo toolchain, because this bare checkout has no `node_modules`; Jest cannot load `next` from `jest.config.ts`, and `npx tsc` reports TypeScript is not installed locally.

## Rollout Plan

No runtime rollout. A later PR can call this selector from the Moves estimate execution path after deciding the data-loading boundary for tenant/deal candidates and global reference rows.

## Deployment Authority

Repo-owned deploy workflow: not applicable.
Shared runtime mutators: none.
Approved image digest: not applicable.
ACA runtime invariant: no ACA runtime change.
Worker image invariant: no worker image change.
Feature/env flag update path: none.
Live signed-in proof required: not applicable until runtime wiring.

## Rollback Plan

Revert the selector module, test file and barrel export. No database or runtime rollback is required.

## Audit Evidence

Inspect selector tests for precedence, unapproved tenant candidate handling, planning-assumption flags, provider-row adapter behavior and internal loaded/scarcity-adjusted conversion.

## Known Gaps

No Moves runtime/API/UI wiring, tenant candidate repository, database load, snapshot migration, margin model, partner buy-rate ingestion or AbarVa sell-rate calculation is included.
