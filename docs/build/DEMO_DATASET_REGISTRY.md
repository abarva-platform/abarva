# Demo Dataset Registry

**Slice:** DEMODATA1  
**Wave:** wave-20  
**Lane:** H  
**Status:** code_complete  
**All data is deterministic seed. No live procurement, no live tenant state, no model calls.**

---

## Tenant × Surface Coverage Matrix

| Tenant          | Overall Tier | Programs | Source  | Intelligence       | Control Tower      | Admin   | Dataset Root                                    | Loader Key     |
| --------------- | ------------ | -------- | ------- | ------------------ | ------------------ | ------- | ----------------------------------------------- | -------------- |
| apex-retail     | rich         | rich     | partial | deterministic_only | deterministic_only | rich    | `datasets/apex-retail-synthetic-v1`             | `apex`         |
| meridian-health | rich         | partial  | partial | rich               | partial            | partial | `datasets/meridian-health-synthetic-v1`         | `meridian`     |
| first-capital   | rich         | partial  | partial | rich               | partial            | partial | `datasets/first-capital-financial-synthetic-v1` | `firstcapital` |

---

## Tenant Detail

### apex-retail (Rich)

Primary demo tenant. Full storyline: Source AMS outsourcing event → Program CDP Activation.

| Surface       | Tier               | Seed File                                           | Caveat                                                           | Route                                             |
| ------------- | ------------------ | --------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------- |
| programs      | rich               | `src/lib/programs/program-flagship-view.ts`         | Deterministic seed. No live programme state.                     | `/tenant/apex-retail/programs`                    |
| source        | partial            | `src/lib/source/source-commercial-demo-scenario.ts` | Deterministic seed. No live vendor data. Fictional vendor names. | `/source/events/apex-retail-ams-outsourcing-2026` |
| intelligence  | deterministic_only | `src/lib/source/intelligence-patterns.ts`           | Deterministic. Not client-specific.                              | `/tenant/apex-retail/intelligence`                |
| control_tower | deterministic_only | `src/lib/source/control-tower-signals.ts`           | Deterministic. No live procurement monitoring.                   | `/tenant/apex-retail/tower`                       |
| admin         | rich               | `docs/build/production-readiness.json`              | Manifest-backed. Not live.                                       | `/platform/admin`                                 |

---

### meridian-health (Rich Synthetic Substrate)

Healthcare rehearsal tenant. The legacy `meridian` key resolves here.

| Surface       | Tier    | Seed File                                                                   | Caveat                                                  |
| ------------- | ------- | --------------------------------------------------------------------------- | ------------------------------------------------------- |
| programs      | partial | `datasets/meridian-health-synthetic-v1`                                     | Route coverage must be smoke-tested before a live demo. |
| source        | partial | `datasets/meridian-health-synthetic-v1/04-vendors`                          | Synthetic vendor and contract evidence only.            |
| intelligence  | rich    | `datasets/meridian-health-synthetic-v1/13-context/client-data-corpus.jsonl` | Synthetic healthcare evidence only.                     |
| control_tower | partial | `datasets/meridian-health-synthetic-v1`                                     | Synthetic operating telemetry only.                     |
| admin         | partial | `datasets/meridian-health-synthetic-v1/manifest.yaml`                       | Admin route proof still requires browser smoke.         |

---

### first-capital (Rich Synthetic Substrate)

Financial-services rehearsal tenant. Legacy `arcturus` remains an alias only.

| Surface       | Tier    | Seed File                                                                           | Caveat                                                  |
| ------------- | ------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------- |
| programs      | partial | `datasets/first-capital-financial-synthetic-v1`                                     | Route coverage must be smoke-tested before a live demo. |
| source        | partial | `datasets/first-capital-financial-synthetic-v1/04-vendors`                          | Synthetic vendor data only.                             |
| intelligence  | rich    | `datasets/first-capital-financial-synthetic-v1/13-context/client-data-corpus.jsonl` | Synthetic financial-services evidence only.             |
| control_tower | partial | `datasets/first-capital-financial-synthetic-v1`                                     | Synthetic operating telemetry only.                     |
| admin         | partial | `datasets/first-capital-financial-synthetic-v1/manifest.yaml`                       | Admin route proof still requires browser smoke.         |

---

## Coverage Summary

| Metric                              | Value                           |
| ----------------------------------- | ------------------------------- |
| Total tenants                       | 3                               |
| Rich tenants                        | 3                               |
| Thin tenants                        | 0                               |
| Shell-only tenants                  | 0                               |
| Tenants with source→program linkage | 1                               |
| Caveat                              | All data is deterministic seed. |

---

## Demo Environment Verification

Run `npm run demo:environment:verify` before hosted sales or investor demos.
This verifies committed synthetic substrate and registry coherence only; hosted
DNS, Clerk users, scheduler logs, and browser route proof remain separate
environment evidence.

---

## Source File

`src/lib/demo/demo-dataset-registry.ts`

Registry API:

- `listDemoDatasets()` — all tenant datasets
- `getDemoDatasetForTenant(slug)` — single tenant or null
- `getSurfaceDataAvailability(slug, surface)` — single surface dataset or null
- `getDemoRouteRecommendation(slug, surface)` — route hint or safe fallback
- `summarizeDemoDataCoverage()` — aggregate coverage summary
