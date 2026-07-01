# 2026-07-01-tower-fy2025-trend-binding — Tower FY2025 Trend Binding

## Release ID

`2026-07-01-tower-fy2025-trend-binding`

## Status

`candidate`

## Plain-English Summary

This release completes the Tower initiative binding fix for FY2025 trend rows. The first binding pass repaired FY26 initiative spend rows, but the Azure quality gate showed that synthetic FY2025 trend rows still referenced initiatives through suffixed identifiers such as `SHA-INIT-001-1-FY2025-...`. The loader now normalizes those references back to the canonical initiative id before writing governed facts.

## Layer Impact

- `client-data-lane`: Updates the governed `cio_tower` loader so FY2025 trend facts bind to initiative entities.

## Client Applicability

- All clients loaded through `tower-standardized-v1`.
- Specific visible symptom: Tower trend and top-program evidence rows can now resolve to named initiatives instead of staying orphaned.
- Feature flag: none.

## Changes Included

- `scripts/tower/load-cio-tower-standardized-v1.mjs`
  - Normalizes FY2025 trend labels and suffixed initiative references into canonical initiative ids.
  - Applies the same logic across tenants; no tenant-specific branch.

## QA / Validation

- `node scripts/tower/load-cio-tower-standardized-v1.mjs --dry-run` must pass.
- Focused lint for the loader must pass.
- `npm run release:check` must pass.
- After deploy, rerun the governed Tower loader in the VNet-visible runtime and then run `node scripts/tower/validate-cio-tower-quality.mjs --require-db`; the initiative-budget orphan check must report 0 for every tenant.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, rerun the governed Tower loader inside the live/VNet runtime, and rerun the Tower DB quality gate plus signed-in Tower prompt/raw/render trace.

## Deployment Authority

- Repo-owned deploy workflow: required for app code.
- Shared runtime mutators: none in this PR.
- Feature/env flag update path: none.
- Live proof required: yes, DB quality gate and signed-in Tower trace after reload.

## Rollback Plan

Rollback by reverting this PR. Schema and source files are unchanged.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- ACA revision/digest: pending.
- Live proof: pending DB quality gate and signed-in Tower trace.

## Known Gaps

This release repairs FY2025 trend binding only. It does not change Tower dashboard design, source templates, or generated financial values.
