# 2026-05-28-packet-30-phase-2b-resolve-tenant-read — Packet 30 Phase 2B Tenant Resolution Read Migration

## Release ID

`2026-05-28-packet-30-phase-2b-resolve-tenant-read`

## Status

`candidate`

## Plain-English Summary

This release starts Packet 30 Phase 2B by moving the bounded tenant-resolution client lookup from the Supabase runtime helper to the Azure read boundary added in Phase 2A. It does not change tenant precedence rules, aliases, cookies, Clerk session behavior, or fallback behavior.

## Layer Impact

- tenant-resolution-lane: `resolveTenant` now reads the `clients` row through `azureRead`.
- data-plane-lane: validates the first runtime consumer of the Azure read boundary.
- runtime-app-lane: limited behavior surface; tenant selection order is unchanged.
- ci-governance-lane: runtime Supabase import census decreases by one file and three import-helper matches.
- client-data-lane: no migrations and no data writes.

## Client Applicability

- All clients: tenant resolution continues through the same canonical alias map and precedence rules.
- SkyHarbor, Apex, Meridian, Northstar, First Capital: no tenant-specific branching added.
- Feature flag: not applicable.

## Changes Included

- `src/lib/tenant/resolveTenant.ts`
- `src/lib/tenant/__tests__/resolveTenant.test.ts`

## QA / Validation

Validation performed:

```text
npx jest src/lib/tenant/__tests__/resolveTenant.test.ts src/lib/data-plane/__tests__/azure-read.test.ts --runInBand
npx eslint src/lib/tenant/resolveTenant.ts src/lib/tenant/__tests__/resolveTenant.test.ts
node scripts/audit/runtime-supabase-import-census.mjs
git diff --check
npx tsc --noEmit --pretty false
```

Results:

- Jest: pass, 2 suites passed, 15 tests passed.
- Focused ESLint: pass.
- Diff whitespace check: pass.
- Runtime Supabase census delta:
  - Files with import/helper matches: 182 -> 181.
  - Import/helper matches: 762 -> 759.
  - Files with broad matches: 330 -> 329.
  - Broad matches: 1,705 -> 1,699.
- Local full TypeScript check: blocked by missing optional dependency type declarations already present in this worktree (`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`). The run produced no `resolveTenant.ts` or `azureRead.ts` type errors.

## Rollout Plan

Merge after CI is green. Production deployment is required because this changes runtime tenant-resolution data access. After deployment, smoke `app.abarva.ai/product` and at least one authenticated Intelligence ask per SkyHarbor and Apex if credentials are available in the runner/session.

## Rollback Plan

Revert this PR to restore `resolveTenant` to its previous Supabase runtime helper. No data migration or schema rollback is required.

## Audit Evidence

- Phase 2A check-in and callsite inventory: `verification/PACKET_30_PHASE_2A_CHECKIN.md`
- This release is the first Phase 2B callsite migration from that inventory.

## Known Gaps

- The broader runtime Supabase burn-down remains incomplete by design. Phase 2B will continue with smaller callsite slices after this tenant-resolution slice is verified in production.
