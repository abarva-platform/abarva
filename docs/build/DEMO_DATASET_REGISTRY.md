# Demo Dataset Registry

**Slice:** DEMODATA1  
**Wave:** wave-20  
**Lane:** H  
**Status:** code_complete  
**All data is deterministic seed. No live procurement, no live tenant state, no model calls.**

---

## Tenant × Surface Coverage Matrix

| Tenant | Overall Tier | Programs | Source | Intelligence | Control Tower | Admin | Source→Program Linkage |
|--------|-------------|----------|--------|--------------|---------------|-------|------------------------|
| apex-retail | rich | rich | partial | deterministic_only | deterministic_only | rich | YES (`source-program-link.ts`) |
| meridian | thin | not_seeded | not_seeded | thin | not_seeded | not_seeded | NO |
| arcturus | shell_only | shell_only | shell_only | shell_only | shell_only | shell_only | NO |

---

## Tenant Detail

### apex-retail (Rich)

Primary demo tenant. Full storyline: Source AMS outsourcing event → Program CDP Activation.

| Surface | Tier | Seed File | Caveat | Route |
|---------|------|-----------|--------|-------|
| programs | rich | `src/lib/programs/program-flagship-view.ts` | Deterministic seed. No live programme state. | `/tenant/apex-retail/programs` |
| source | partial | `src/lib/source/source-commercial-demo-scenario.ts` | Deterministic seed. No live vendor data. Fictional vendor names. | `/source/events/apex-retail-ams-outsourcing-2026` |
| intelligence | deterministic_only | `src/lib/source/intelligence-patterns.ts` | Deterministic. Not client-specific. | `/tenant/apex-retail/intelligence` |
| control_tower | deterministic_only | `src/lib/source/control-tower-signals.ts` | Deterministic. No live procurement monitoring. | `/tenant/apex-retail/tower` |
| admin | rich | `docs/build/production-readiness.json` | Manifest-backed. Not live. | `/platform/admin` |

---

### meridian (Thin)

Thin demo tenant. Intelligence demo only.

| Surface | Tier | Seed File | Caveat |
|---------|------|-----------|--------|
| programs | not_seeded | — | Not seeded. |
| source | not_seeded | — | Not seeded. |
| intelligence | thin | — | Thin demo. |
| control_tower | not_seeded | — | Not seeded. |
| admin | not_seeded | — | Not applicable. |

---

### arcturus (Shell Only)

Shell-only tenant. Clerk test account only. No data seeded on any surface.

| Surface | Tier | Caveat |
|---------|------|--------|
| programs | shell_only | Shell only. |
| source | shell_only | Shell only. |
| intelligence | shell_only | Shell only. |
| control_tower | shell_only | Shell only. |
| admin | shell_only | Shell only. |

---

## Coverage Summary

| Metric | Value |
|--------|-------|
| Total tenants | 3 |
| Rich tenants | 1 |
| Thin tenants | 1 |
| Shell-only tenants | 1 |
| Tenants with source→program linkage | 1 |
| Caveat | All data is deterministic seed. |

---

## Source File

`src/lib/demo/demo-dataset-registry.ts`

Registry API:
- `listDemoDatasets()` — all tenant datasets
- `getDemoDatasetForTenant(slug)` — single tenant or null
- `getSurfaceDataAvailability(slug, surface)` — single surface dataset or null
- `getDemoRouteRecommendation(slug, surface)` — route hint or safe fallback
- `summarizeDemoDataCoverage()` — aggregate coverage summary
