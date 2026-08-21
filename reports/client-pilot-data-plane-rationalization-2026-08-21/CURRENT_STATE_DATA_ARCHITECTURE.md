# Current-State Data Architecture

## Target Flow

```text
CLIENT SOURCES
  -> IMMUTABLE LANDING / EVIDENCE
  -> PARSED / STAGING
  -> CANONICAL ENTERPRISE KNOWLEDGE
  -> DOMAIN OPERATIONAL STATE
  -> SHARED CONSUMPTION PROJECTIONS
  -> PRODUCT EXPERIENCES
  -> APPROVED ARTIFACTS
```

The controlling principle is already present in the repo architecture contract: `docs/architecture/ENTERPRISE_INFORMATION_ARCHITECTURE.md:15-36` says products are projections of the Canonical Enterprise Model, and no product owns data.

## Observed Current Flow

```text
Tenant input files and workbooks
  -> local/generated tenant-input folders
  -> source adapters and projection builders where implemented
  -> mixed canonical/context tables, domain workflow tables, and marts
  -> Home / Intelligence / Moves / Source / Tower / Admin route readers
  -> generated artifacts, approved content, snapshots, and export formats
```

This is not yet one clean chain. The current checkout shows several parallel truth paths:

- Registry-declared active input roots are present, but adjacent standard packs, candidate packs, generated packs, derived outputs, and approved product content also exist. Evidence: `reports/tenant-layer-refresh-2026-08-12/summary.md:11-28`.
- The August refresh preparation explicitly marked active roots as hard gates and generated outputs as disposable build output. Evidence: `reports/tenant-layer-refresh-2026-08-12/summary.md:13-28`.
- Adapter coverage was incomplete in that preparation: 4 mapping profiles covered 3 source classes against 10 declared adapter families, and no adapter was executed. Evidence: `reports/tenant-layer-refresh-2026-08-12/summary.md:56-65`.
- The July Source/Moves audit found real artifact governance and metadata for the primary Source generation route, but a bypass route can persist chat-authored markdown with no generation metadata. Evidence: `docs/audits/SOURCE-VS-MOVES-STANDARD-AUDIT-2026-07-23.md:26-42`, `docs/audits/SOURCE-VS-MOVES-STANDARD-AUDIT-2026-07-23.md:85-93`.
- The Tower reconciliation audit found local source-to-projection fixes but explicitly did not prove Azure/Postgres live rows, live rebuild, deploy, or browser-visible proof. Evidence: `docs/audits/TOWER-DATA-LAYER-RECONCILIATION-2026-06-27.md:66-76`.
- The legacy context retirement report was local-only and did not mutate Azure/Postgres, promote tenants, deploy, archive, or delete. Evidence: `reports/legacy-context-retirement/summary.md:1-13`.

## Static Object Baseline

See `physical-object-inventory.json`.

Current static SQL scan found:

- 291 migration files.
- 516 `CREATE TABLE` matches.
- 32 views.
- 1 materialized view.
- 66 functions.
- 98 triggers.
- 861 indexes.
- 553 policies.

This static count is not the live database count. Runtime catalog profiling is blocked from this environment until Azure Postgres DNS/network access is available.

## Active Route Baseline

See `file-and-route-baseline.json`.

Current static app route scan found 564 `page.tsx` or `route.ts` files under `src/app`.

The first-pass product route map is in `reports/enterprise-data-flow-map-2026-08-21/module-chains.json`. Key findings:

- Home route root could not be traced to a tracked reader implementation for `readSkyHarborAiSuccessHome`.
- Tower route root reads `cio_tower` marts.
- Moves route root reads Programs via the `engagements` read adapter.
- Source vendor portfolio reads schema-qualified Source/Tower/doc tables through the Azure Postgres data-model adapter.
- Intelligence route root uses an authored enterprise landscape view model rather than directly using enterprise-context read models.
- Admin/Setup mixes DB-backed context reads with file-system artifact enumeration.

## Runtime Gap

The live database read-only profile attempted to connect with `application_name=codex-data-plane-rationalization-readonly`, but DNS resolution failed. See `runtime-profile-attempt.json`.

No object disposition should be treated as final until runtime writers/readers are profiled through query logs, route probes, ACA jobs, and signed-in consumer checks.

