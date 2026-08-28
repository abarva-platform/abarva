# 2026-08-28-ecl-object-semantic-type-identity — ECL Semantic Identity And Value Proof Guard

## Release ID

`2026-08-28-ecl-object-semantic-type-identity`

## Status

`candidate`

## Plain-English Summary

This release candidate makes canonical object meaning part of database identity and tightens a Tower
Value Proof read-path guard. Physical object families can still share tables, but a budget object,
value observation, finance approval event, and evidence item must remain distinguishable by a
first-class semantic type before downstream products or cubes read them. The Tower trajectory stat
also stops substituting finance run-rate or cash values for recorded P&L.

## Layer Impact

Release lanes: `client-data-lane`, `global-control-lane`.

Layer 3 canonical model: Adds a stored `canonical_semantic_type` column to `ecl_context.object`,
derived from the loader's canonical semantic attribute with a fallback to `object_type` for older
generic object rows. Replaces the old object uniqueness boundary with one that includes semantic
type.

Layer 4 products: The Tower Value Proof tab keeps finance run-rate, realized cash, and recorded P&L
separate in the trajectory stat block. The unproven value stat is based on promised value that is not
board-claimable, not on a fallback actual.

## Client Applicability

- All clients: Applies to the shared ECL canonical schema once the migration is explicitly run.
- Specific clients: None.
- Internal only: Loader and validation scripts gain stronger readback checks.
- Product surface: Tower Value Proof trajectory stats use stricter value semantics.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Migration: `supabase/migrations/20260828211000_ecl_object_semantic_type_identity.sql`
  skips cleanly when `ecl_context.object` is not present, and applies the semantic identity change
  when the table exists.
- Schema draft: `docs/architecture/sql-drafts/ecl_physical_schema_v1_draft.sql`
- Loader readback: `scripts/tower/load-healthcare-demo-layer3-canonical.mjs`
- Validation: `scripts/tower/validate-healthcare-demo-layer3-canonical.mjs`
- Regression test: `scripts/ecl/__tests__/run-ecl-object-semantic-type-tests.mjs`
- Tower Value Proof view: `src/components/tower/command-center/views/ContractTabs.tsx`
- Tower Value Proof regression test:
  `src/components/tower/command-center/__tests__/plan-variance-label.test.ts`
- NPM script: `test:ecl-object-semantic-type`

## QA / Validation

- `npm run test:ecl-object-semantic-type` passed. The test proves distinct semantic rows can share
  a physical object family and object key, while duplicate semantic identity still fails.
- `npm run test:ecl-object-type-catalog` passed. Existing object-type catalog views continued to
  count application, deployment, technical component, and business object rows correctly.
- `npm run tower:healthcare-demo-layer3-canonical:load -- --out-dir /tmp/tower-layer3-semantic-column-20260828`
  passed in dry-run mode. The summary reported 987 canonical objects, 2,531 measures, 280
  relationships, and the expected semantic object split.
- `node scripts/tower/validate-healthcare-demo-layer3-canonical.mjs --summary /tmp/tower-layer3-semantic-column-20260828/tower_layer3_ecl_context_load_summary.json --summary-only`
  passed. This validates the generated package without claiming Azure readback.
- `npx eslint scripts/ecl/__tests__/run-ecl-object-semantic-type-tests.mjs scripts/tower/load-healthcare-demo-layer3-canonical.mjs scripts/tower/validate-healthcare-demo-layer3-canonical.mjs`
  passed.
- `npm test -- --runTestsByPath src/components/tower/command-center/__tests__/plan-variance-label.test.ts`
  passed. Jest emitted existing duplicate manual mock warnings, but the targeted suite passed.
- `npx eslint src/components/tower/command-center/views/ContractTabs.tsx src/components/tower/command-center/__tests__/plan-variance-label.test.ts`
  passed.
- `git diff --check` passed.
- `npm run release:check -- --base origin/main --head HEAD` passed.

## Rollout Plan

Merge the candidate after local validation and PR review. The Tower read-path guard becomes active
through the normal repo-owned web deploy. Applying the migration to an Azure data plane is a separate
operator action and should not happen until the release owner approves the data schema gate.
Cube-building work should start only after the migration has been applied and read back successfully.

## Deployment Authority

- Repo-owned deploy workflow: Required only for code/docs/script distribution after merge.
- Shared runtime mutators: None in this candidate.
- Approved image digest: To be recorded if merged and deployed.
- ACA runtime invariant: Required only if the web image is deployed.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Required for the Tower Value Proof stat block after web deploy.

## Rollback Plan

Before the migration is applied, rollback is a normal code revert. After migration apply, rollback
requires restoring the old object uniqueness constraint only after verifying there are no same-key
objects that differ by semantic type; otherwise the rollback would collapse distinct canonical rows.

## Audit Evidence

- PR URL: Pending.
- Local schema replay: `npm run test:ecl-object-semantic-type`.
- Existing object-type replay: `npm run test:ecl-object-type-catalog`.
- Layer 3 dry-run summary:
  `/tmp/tower-layer3-semantic-column-20260828/tower_layer3_ecl_context_load_summary.json`.
- Summary-only validator: passed against the same dry-run summary.
- Tower Value Proof regression: targeted Jest suite passed.
- Release check: `npm run release:check -- --base origin/main --head HEAD`.

## Known Gaps

The migration is not applied to any Azure data plane by this candidate. No cubes are built here.
