# Client Pilot Data Plane Rationalization & Migration Readiness Sweep

Generated: 2026-08-21
Mode: read-only baseline and sweep scaffold
Status: migration not authorized

This package implements the requested pause boundary and starts the End-to-End Data Plane Rationalization Sweep from verified current evidence. It reuses nearby audit baselines where found, records the earlier 131-object audit split as request-supplied but not source-verified in this checkout, and separates static proof from runtime proof.

## Freeze State

Broad refresh and snapshot promotion are paused for this workstream. No Home golden snapshot promotion, broad downstream refresh, canonical backfill, table rename/drop, migration apply, consumer repointing, model-derived enrichment, or live data cutover was performed.

## Files

- `FREEZE_NOTICE.md` - explicit freeze and allowed activity boundary.
- `CURRENT_STATE_DATA_ARCHITECTURE.md` - current logical and observed data-flow map.
- `physical-object-inventory.json` - generated static SQL inventory from `supabase/migrations`.
- `file-and-route-baseline.json` - generated route and tenant-input file baseline.
- `writer-reader-lineage-matrix.json` - first-pass writer/reader lineage from verified code paths.
- `truth-authority-matrix.json` - target authority per business object family.
- `duplicate-collision-report.json` - duplicate truth and unresolved conflict register.
- `legacy-path-register.json` - legacy path/read-only/archive readiness register.
- `TARGET_CLIENT_PILOT_DATA_ARCHITECTURE.md` - recommended pilot layer contract.
- `migration-cutover-backlog.json` - gated migration readiness backlog by wave.
- `runtime-profile-attempt.json` - live profiling attempt and blocker.
- `PHASE_2_ACA_RUNTIME_PROFILING_HANDOFF.md` - exact VNet-connected read-only ACA job handoff.
- `package-json-runtime-profile-entrypoint.patch` - isolated `package.json` npm-script addition, separated because the local worktree already had unrelated `package.json` drift.

Related static map produced immediately before this package:

- `reports/enterprise-data-flow-map-2026-08-21/DATA_FLOW_MAP.md`
- `reports/enterprise-data-flow-map-2026-08-21/tables.json`
- `reports/enterprise-data-flow-map-2026-08-21/module-chains.json`
- `reports/enterprise-data-flow-map-2026-08-21/conflicts.json`
- `reports/enterprise-data-flow-map-2026-08-21/orphans.json`

## Baseline

- `main` SHA: `5752b5c0e62948069fa8693566319ddaaa4620c6`
- Current `HEAD`: `46b74864c4e77df7799c3289cec48a7994ffa30a`
- Current branch: `codex/source-event-archive-cleanup`
- Active tenant registry evidence: `datasets/tenant-inputs/tenant-input-registry.json:30-130`
- Governing architecture evidence: `docs/architecture/ENTERPRISE_INFORMATION_ARCHITECTURE.md:15-36`

## Current Static Counts

- SQL migration files scanned: 291
- Static SQL object matches: 516 tables, 32 views, 1 materialized view, 66 functions, 98 triggers, 861 indexes, 553 policies
- App `page.tsx` / `route.ts` files under `src/app`: 564
- Files under `datasets/tenant-inputs`: 559

## Runtime Status

Runtime profiling is not complete. `.env.local` contains Azure database URLs, but the configured Azure Postgres host did not resolve from this environment during a read-only catalog/count attempt:

`getaddrinfo ENOTFOUND pg-abarva-context-lab-001.postgres.database.azure.com`

Until the live DB profile is captured from a network with access, this package is a static-current and readiness scaffold, not migration authority.

The Phase 2 profiler entrypoint has been added as `npm run audit:client-pilot-runtime-profile`. It must be run through the private ACA operator job after merge/deploy of a digest-pinned image and with a read-only database secret, as described in `PHASE_2_ACA_RUNTIME_PROFILING_HANDOFF.md`.

## Reproduce

Static inventories were generated from the checkout with a Node script that scans `supabase/migrations`, `src/app`, and `datasets/tenant-inputs`. JSON validation:

```bash
node -e "for (const p of ['physical-object-inventory.json','file-and-route-baseline.json','writer-reader-lineage-matrix.json','truth-authority-matrix.json','duplicate-collision-report.json','legacy-path-register.json','migration-cutover-backlog.json','runtime-profile-attempt.json']) JSON.parse(require('fs').readFileSync('reports/client-pilot-data-plane-rationalization-2026-08-21/'+p,'utf8')); console.log('json ok')"
```
