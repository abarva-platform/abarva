# 2026-05-29-packet-30-phase-2c-codemod-inventory — Packet 30 Phase 2C Codemod Inventory

## Release ID

`2026-05-29-packet-30-phase-2c-codemod-inventory`

## Status

`candidate`

## Plain-English Summary

This release adds a read-only inventory script for Packet 30 Phase 2C. The script scans runtime `src/app` and `src/lib` files, matches the existing runtime Supabase census exactly, and classifies each remaining candidate before any codemod transformation begins.

## Layer Impact

- data-plane-lane: inventory only; no runtime behavior changes.
- release-governance-lane: creates Phase 2C evidence artifacts under `verification/packet-30-phase-2c/`.
- runtime-app-lane: no code changes.
- client-data-lane: no data changes.

## Client Applicability

- All tenants: no runtime impact.
- Feature flag: not applicable.

## Changes Included

- Added `scripts/codemods/phase-2c-supabase-read-inventory.mjs`.
- Generated `verification/packet-30-phase-2c/CODEMOD_INVENTORY.json`.
- Generated `verification/packet-30-phase-2c/CODEMOD_INVENTORY.md`.
- Inventory classifications:
  - `READ_ONLY_SELECT`: 119
  - `MIXED_READ_WRITE`: 82
  - `READ_WITH_STORAGE`: 4
  - `MUTATION_WRITE`: 1
  - `DEFER_MANUAL`: 119
- Census parity:
  - `176 files / 725 import-helper matches`
  - `325 files / 1647 broad matches`

## QA / Validation

Validation performed:

```text
node scripts/codemods/phase-2c-supabase-read-inventory.mjs
node scripts/audit/runtime-supabase-import-census.mjs
node --check scripts/codemods/phase-2c-supabase-read-inventory.mjs
npx eslint scripts/codemods/phase-2c-supabase-read-inventory.mjs
git diff --check
npm run release:check -- --base 2d777646f619e193775082b6d22ffc3921357ed2 --head HEAD
```

Results:

- Inventory script: pass.
- Runtime Supabase census parity: pass; counts match exactly.
- Node syntax check: pass.
- Focused ESLint: pass.
- Diff whitespace check: pass.
- Release control: pass.

## Rollout Plan

Merge as a read-only inventory PR after CI is green. No production deployment is required because this release does not change runtime product behavior.

## Rollback Plan

Revert this PR to remove the inventory script and generated 2C.0 artifacts. No runtime rollback is required.

## Audit Evidence

- Packet 30 Phase 2C proposal was approved by founder on 2026-05-29.
- This is the required 2C.0 read-only inventory PR before any code transformation begins.

## Known Gaps

- This PR does not transform any runtime reads.
- This PR does not flip the Supabase guard from warn to fail.
- This PR does not start Apex Level-3 E2E.
