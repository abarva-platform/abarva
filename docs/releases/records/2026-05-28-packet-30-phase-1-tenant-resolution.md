# 2026-05-28-packet-30-phase-1-tenant-resolution — Packet 30 Phase 1 Tenant Resolution

## Release ID

`2026-05-28-packet-30-phase-1-tenant-resolution`

## Status

`candidate`

## Plain-English Summary

This release adds the Packet 30 Phase 1 tenant-resolution chokepoint. The app now has one canonical place to translate app client keys, historical aliases, broker keys, and loaded substrate keys for Apex, Meridian, First Capital, Northstar, and SkyHarbor. The Intelligence ask route now passes that canonical tenant object into tenant enterprise retrieval, which closes the class of bugs where the data exists but Sentinel cannot reach it because one layer says `skyharbor` while another stores `skyharbor-air`.

## Layer Impact

- runtime-app-lane: `/api/intelligence/ask` now resolves a `CanonicalTenant` once and passes it into retrieval.
- tenant-routing-lane: `src/lib/tenant/aliases.ts` and `src/lib/tenant/resolveTenant.ts` become the central tenant vocabulary and resolver.
- reasoning-retrieval-lane: tenant enterprise and structured-fact retrieval accept canonical tenant input and normalize through the shared alias map.
- security-isolation-lane: locked client/maestro users still ignore requested tenant changes; explicit tenant-domain personas now include Northstar and SkyHarbor.
- client-data-lane: no schema changes and no data-plane writes.

## Client Applicability

- All clients: shared tenant resolution and legacy active-client helpers now route through the same canonical resolver.
- SkyHarbor: fixes the alias path that could prevent loaded `skyharbor-air` enterprise chunks from reaching Sentinel.
- Northstar: keeps `northstar` app key aligned to the loaded `northstar-medtech` substrate key.
- Apex, Meridian, First Capital: preserves existing alias behavior through the shared map.
- Feature flag: not applicable.

## Changes Included

- `src/lib/tenant/CanonicalTenant.ts`
- `src/lib/tenant/aliases.ts`
- `src/lib/tenant/resolveTenant.ts`
- `src/lib/tenant/__tests__/resolveTenant.test.ts`
- `src/lib/active-client.ts`
- `src/lib/tenant-keys.ts`
- `src/lib/auth/access-routing.ts`
- `src/lib/agent/tools/intelligence/_shared.ts`
- `src/lib/knowledge/tenant-enterprise-context.ts`
- `src/lib/intelligence/ask/index.ts`
- `src/lib/intelligence/ask/tenant-key-resolution.ts`
- `src/app/api/intelligence/ask/route.ts`

## QA / Validation

Validation performed:

```text
npx jest src/lib/tenant/__tests__/resolveTenant.test.ts src/lib/__tests__/active-client.test.ts src/lib/knowledge/__tests__/tenant-enterprise-context.test.ts src/lib/agent/tools/intelligence/__tests__/_shared.test.ts --runInBand
npx eslint src/lib/tenant/aliases.ts src/lib/tenant/CanonicalTenant.ts src/lib/tenant/resolveTenant.ts src/lib/tenant-keys.ts src/lib/active-client.ts src/lib/auth/access-routing.ts src/lib/agent/tools/intelligence/_shared.ts src/lib/knowledge/tenant-enterprise-context.ts src/app/api/intelligence/ask/route.ts src/lib/intelligence/ask/index.ts src/lib/intelligence/ask/tenant-key-resolution.ts src/lib/tenant/__tests__/resolveTenant.test.ts
npx tsc --noEmit --pretty false
```

Results:

- Focused Jest: pass, 4 suites passed, 51 tests passed.
- Focused ESLint: pass.
- Typecheck: blocked locally by missing optional packages in the dependency installation (`@azure/identity`, `@azure/storage-blob`, `@azure/service-bus`, `pptxgenjs`, `@resvg/resvg-js`). No errors were emitted for files touched by this release before dependency resolution failed.

## Rollout Plan

Merge after CI is green. Production deployment is required because `/api/intelligence/ask` runtime tenant routing changes. After deployment, run a production smoke as SkyHarbor and Apex/Meridian to verify tenant-specific retrieval and no cross-tenant leakage.

## Rollback Plan

Revert this PR and redeploy. There are no migrations, data writes, or loader changes to roll back.

## Audit Evidence

- Packet 30 Phase 1 implementation is isolated to tenant resolution and Intelligence retrieval wiring.
- Resolver tests cover SkyHarbor and Northstar alias normalization, explicit tenant emails overriding stale cookies, unlocked body selection, cookie-only resolution, locked-role cross-tenant prevention, Clerk failure fallback, strict missing-tenant failure, and strict unknown-tenant failure.
- Existing active-client compatibility tests and tenant enterprise retrieval tests still pass.

## Known Gaps

- Remaining Packet 30 phases are not included here: Phase 2 data-plane burn-down, Phase 3 coverage contract, Phase 4 verifier rebuild, Phase 5 partial-evidence policy, Phase 6 E2E validation, and Phase 7 demo certificate.
- Some call sites still use legacy helper names such as `getActiveClientRow`; those helpers now delegate to `resolveTenant`, preserving compatibility while moving resolution to one implementation.
