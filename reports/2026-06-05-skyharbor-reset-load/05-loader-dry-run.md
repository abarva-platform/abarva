# SkyHarbor Reset/Load Pass - 05 Loader Dry Run

Created: 2026-06-06

## Command

```bash
TENANT_KEY=skyharbor node scripts/skyharbor/stages/06_load_to_azure/azure_postgres_loader.mjs --dry-run --skip-embeddings
```

## Result

Pass. The dry-run did not require live DB connectivity and matched expected counts.

```text
SkyHarbor Azure load wrapper
  tenant: skyharbor
  flags:  --dry-run --skip-embeddings
═══════════════════════════════════════════════════════════════
Packet 24 Substrate Loader · tenant=skyharbor · DRY-RUN
═══════════════════════════════════════════════════════════════
  client_id:  6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301
  tenant_key: skyharbor-air
  dataset:    datasets/skyharbor-air-synthetic-v1
  only-chunks: false
  only-tables: false
  skip-tables: false

━━ PHASE 0 · clients profile ━━
  [DRY-RUN] Would update clients row 6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301 with 9 profile fields

━━ PHASE 1 · enterprise_context_source_files ━━
  Found 1 source files
  [DRY-RUN] Would attempt insert of 1 rows (NOTE: source_id has FK constraint; if it requires a parent row this phase will be skipped)

━━ PHASE 2 · enterprise_context_chunks + embeddings ━━
  Found 480 chunks in 13-context/client-data-corpus.jsonl
  Found 2760 chunks in 16-industry-pattern-overlay/airline-industry-pattern-chunks.jsonl
  Found 3240 chunks total
  [DRY-RUN] Would upsert 3240 chunks + embed each via AI Egress

━━ PHASE 3 · applications ━━
  Found 92 apps
  [DRY-RUN] Would insert 92 apps (criticality mapped to tier1-4)

━━ PHASE 4 · ai_initiatives ━━
  Found 38 initiatives
  [DRY-RUN] Would upsert 38 initiatives

━━ PHASE 5 · vendor_contracts ━━
  Found 52 vendor contracts
  [DRY-RUN] Would upsert 52 vendor contracts

═══════════════════════════════════════════════════════════════
Summary
═══════════════════════════════════════════════════════════════
  Phase 0 client:        updated=1, errors=0
  Phase 1 source files:  inserted=1, errors=0
  Phase 2 chunks:        upserted=3240, embedded=0, failed=0
  Phase 3 applications:  inserted=92, errors=0
  Phase 4 initiatives:   inserted=38, errors=0
  Phase 5 vendors:       inserted=52, errors=0
```

## Expected Count Check

| Expected | Observed | Status |
|---|---:|---|
| Tenant key `skyharbor-air` | `skyharbor-air` | pass |
| Client id `6f3c8d21-9b45-4f12-8d61-4b8f7c2a9301` | same | pass |
| Main context chunks | 480 | pass |
| Airline overlay chunks | 2,760 | pass |
| Total chunks | 3,240 | pass |
| Applications | 92 | pass |
| Initiatives | 38 | pass |
| Vendor contracts | 52 | pass |

## Caveat

The command included `--skip-embeddings`, but the shared loader currently does not parse that flag. This is safe in dry-run because no embedding call happens. It is not safe to assume this flag suppresses embeddings during a real run.
