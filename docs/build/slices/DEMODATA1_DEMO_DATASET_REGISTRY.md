# DEMODATA1 — Demo Dataset Registry and Tenant Richness Model

**Wave:** wave-20  
**Lane:** H  
**Status:** code_complete  
**Branch:** wave20/demodata1-tenant-richness-registry

---

## What this slice lands

DEMODATA1 lands a deterministic, file-pure demo dataset registry at
`src/lib/demo/demo-dataset-registry.ts` that encodes the full tenant richness
model across all three demo tenants (apex-retail, meridian, arcturus) and five
product surfaces (programs, source, intelligence, control_tower, admin).

---

## Files

| File | Purpose |
|------|---------|
| `src/lib/demo/demo-dataset-registry.ts` | Registry implementation — types, datasets, public API |
| `src/__tests__/integration/demo/demo-dataset-registry.test.ts` | Integration test suite (17 assertions) |
| `docs/build/DEMO_DATASET_REGISTRY.md` | Tenant × surface coverage matrix and reference |
| `docs/build/slices/DEMODATA1_DEMO_DATASET_REGISTRY.md` | This slice contract |

---

## Tenant richness model

| Tenant | Overall Tier | Note |
|--------|-------------|------|
| apex-retail | rich | Primary demo tenant. Full Source → Program storyline. |
| meridian | thin | Intelligence demo only. |
| arcturus | shell_only | Clerk account only. No data seeded. |

---

## Public API

```typescript
listDemoDatasets(): DemoTenantDataset[]
getDemoDatasetForTenant(tenantSlug: string): DemoTenantDataset | null
getSurfaceDataAvailability(tenantSlug: string, surface: DemoSurfaceKey): DemoSurfaceDataset | null
getDemoRouteRecommendation(tenantSlug: string, surface: DemoSurfaceKey): string
summarizeDemoDataCoverage(): DemoCoverageSummary
```

---

## Constraints

- Deterministic seed only. No live data, no network calls, no model calls.
- Every surface dataset carries `deterministicSeed: true`.
- Safe fallback route: `/tenant/apex-retail/programs` for any tenant/surface without a routeHint.
- production_deployment status preserved (still blocked); no component promoted.
- No false production_ready claims.
