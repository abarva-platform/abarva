# 2026-05-26-control-plane-cleanup-batch1 — CDP Pattern Seed Data-Plane Move

## Release ID

`2026-05-26-control-plane-cleanup-batch1`

## Status

`candidate`

## Plain-English Summary

This change moves the Apex-tagged CDP pattern seed body out of the application control plane and into the tenant data-plane subtree. Existing imports still use the same `CDP_PATTERNS` module, but the tenant-specific pattern content now lives under `src/data/apexretail/` where the control-plane tenant-purity scanner intentionally does not count tenant fixture data.

## Layer Impact

- global-control-lane: Keeps the public `src/lib/intelligence/seed-patterns-cdp.ts` module as a thin export surface so existing consumers keep working.
- client-data-lane: Moves the Apex CDP pattern seed content into `src/data/apexretail/cdp-pattern-seed.ts`, matching the rule that client-specific seed content belongs in data-plane files.
- internal-admin: Adds this release record so the cleanup is visible in the release ledger and auditable by layer.

## Client Applicability

- All clients: No runtime behavior change intended. Existing CDP pattern consumers continue to receive the same pattern array.
- Specific clients: Apex Retail seed content is now located in the Apex Retail data-plane subtree.
- Internal only: This is primarily an architectural debt-reduction cleanup.
- Public/demo only: No public copy change.
- Feature flag: None.

## Changes Included

- Moved CDP pattern seed content from `src/lib/intelligence/seed-patterns-cdp.ts` to `src/data/apexretail/cdp-pattern-seed.ts`.
- Replaced the original control-plane module with a thin re-export from the data-plane seed file.
- Added this release record.

## QA / Validation

- `npm run release:check -- --base origin/main --head HEAD` passed.
- `npx eslint src/lib/intelligence/seed-patterns-cdp.ts src/data/apexretail/cdp-pattern-seed.ts` passed.
- `npx tsc --noEmit --pretty false` passed.
- `git diff --check` passed.
- `node scripts/audit/control-plane-tenant-purity.mjs --json` shows the target file now has zero scanner hits.
- `node scripts/audit/control-plane-tenant-purity.mjs --check` remains blocked by unrelated baseline drift already present outside this PR scope: Meridian Health, First Capital, Heliara, Arcturus Financial, and Northstar Clinical.
- `npx jest src/lib/__tests__/control-plane-tenant-purity.test.ts --runInBand` remains blocked by unrelated duplicate manual mocks plus existing Northstar Clinical literals outside this PR scope.

## Rollout Plan

Merge to `main`; Vercel deploys the unchanged public module shape with the seed body resolved from the data-plane file. No migration, feature flag, or manual runbook is required.

## Rollback Plan

Revert this PR to move the CDP seed body back into the original control-plane module. No database rollback is required.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2360
- Scanner evidence: `Apex Retail` count decreases by 1 in this bounded slice; target file hits decrease from 1 to 0.
- Validation evidence: Local release gate, focused lint, TypeScript, diff whitespace checks, and scanner JSON verification passed.

## Known Gaps

The broader control-plane tenant-purity baseline is still above threshold on `origin/main` for files outside this Batch 1 scope. This PR is intentionally scoped to the CDP seed move only and does not touch context-layer routes/read models, `api/intelligence/ask`, active-client resolution, duplicate Jest mocks, or loader scripts.
