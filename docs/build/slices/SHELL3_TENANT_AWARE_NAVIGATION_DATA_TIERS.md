# SHELL3 — Tenant-Aware Navigation and Demo Data Tier Badges

**Wave:** wave-20
**Lane:** C
**Status:** code_complete
**Branch:** wave20/shell3-tenant-aware-navigation

## Summary

SHELL3 lands the deterministic demo tenant data tier system that encodes which surfaces have
meaningful seed data for each of the three demo tenants (apex-retail, meridian, arcturus).
A lightweight React badge component renders the tier inline wherever tenant context is shown.

## Files Landed

| File | Purpose |
|------|---------|
| `src/lib/tenants/demo-tenant-data-tiers.ts` | Read model: tenant data tiers, surface availability, route hints |
| `src/components/abarva/TenantDataTierBadge.tsx` | Badge component: renders richness tier with optional caveat tooltip |
| `src/__tests__/integration/tenants/demo-tenant-data-tiers.test.ts` | 17 integration tests covering all public functions |

## Tenant Data Tiers

| Tenant | Richness | Programs | Source | Intelligence | Tower | Admin |
|--------|----------|----------|--------|--------------|-------|-------|
| apex-retail | rich | full | partial | deterministic_only | deterministic_only | full |
| meridian | thin | not_seeded | not_seeded | thin | unavailable | unavailable |
| arcturus | shell_only | unavailable | unavailable | unavailable | unavailable | unavailable |

## Key Design Decisions

- All data is deterministic seed. No live procurement data, no live model calls, no network calls.
- `sourceProgramLinkage` is true only for apex-retail (Wave 19 LINK1 / SRC33 storyline).
- `getTenantRouteFallback` always returns a string; safe fallback is `/tenant/apex-retail/programs`.
- Badge uses AbarVa design tokens (#1B2B5C rich, #525866 non-rich, DM Sans font family).

## Constraints Preserved

- No live vendor response, no live intelligence, no live monitoring.
- No model calls, no network calls, no database writes.
- production_deployment status preserved (still blocked).
- prod-deploy-verification blocker preserved verbatim.
