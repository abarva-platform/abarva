# Apex Foundation Training — Section 7.1 Substrate Refresh

Run date: 2026-05-30  
Tenant: `apex-retail`  
Backlog item: Section 7.1 — Packet 35 Phase 4 / Apex Foundation Training

## Executive Summary

PASS. Apex Retail now has a complete tenant foundation substrate loaded into the
live Postgres context layer, embedded, and verified through the production Ask
path.

In plain English: the app no longer has only the retail industry library for
Apex. It also has Apex's own company context: org structure, systems, IT spend,
KPIs, programs, sourcing artifacts, deliverables, evidence, telemetry, vendors,
compliance posture, industry context, and cross-program signals.

## Completion

- Section 7.1 status: complete
- Setup families populated: 14/14
- Setup-plus-overlay capability count: 15/15
- Setup records loaded: 514
- Setup chunks loaded: 526
- Setup chunks embedded: 526/526
- Graph nodes loaded: 314
- Graph edges loaded: 389
- Retail overlay chunks still present: 5,691
- Deterministic Apex verifier: 12/12
- Live Apex Tier-1 verifier: 25/25

## Why 14 Setup Families Counts As 15 Capabilities

The live `data_inventory_segments.family_number` constraint currently allows
families 1-14. The fifteenth Section 7.1 capability is the already-loaded
`retail-v1` corpus overlay for Apex Retail. The acceptance is therefore met as:

- 14/14 tenant setup data families in `data_inventory_segments`
- 1/1 Apex retail industry overlay in `enterprise_context_chunks`
- Total: 15 substrate capabilities available to Apex

## Segment Coverage

| Family | Segment                 | Records | Coverage | Health   | Stale | Missing |
| -----: | ----------------------- | ------: | -------: | -------- | ----: | ------: |
|      1 | `enterprise_profile`    |       1 |   100.00 | complete |     0 |       0 |
|      2 | `org_structure`         |     123 |   100.00 | complete |     0 |       0 |
|      3 | `it_landscape`          |      96 |   100.00 | complete |     5 |       0 |
|      4 | `it_financials`         |      95 |   100.00 | complete |     0 |       0 |
|      5 | `kpi_dictionary`        |      50 |   100.00 | complete |     0 |       0 |
|      6 | `program_inventory`     |       4 |   100.00 | complete |     0 |       0 |
|      7 | `sourcing_artifacts`    |      30 |   100.00 | complete |    18 |       0 |
|      8 | `program_deliverables`  |       4 |   100.00 | complete |     0 |       0 |
|      9 | `evidence_ledger`       |      20 |   100.00 | complete |     9 |       0 |
|     10 | `operating_telemetry`   |      20 |   100.00 | complete |     2 |       0 |
|     11 | `vendor_contracts`      |      38 |   100.00 | complete |     0 |       0 |
|     12 | `compliance`            |      11 |   100.00 | complete |     0 |       0 |
|     13 | `industry_context`      |      10 |   100.00 | complete |     0 |       0 |
|     14 | `cross_program_signals` |      12 |   100.00 | complete |     0 |       0 |

## Chunk Embedding Evidence

| Source                  | Chunks | Embedded |
| ----------------------- | -----: | -------: |
| `enterprise_profile`    |      2 |        2 |
| `org_structure`         |    126 |      126 |
| `it_landscape`          |     96 |       96 |
| `it_financials`         |     95 |       95 |
| `kpi_dictionary`        |     50 |       50 |
| `program_inventory`     |      4 |        4 |
| `sourcing_artifacts`    |     32 |       32 |
| `program_deliverables`  |      8 |        8 |
| `evidence_ledger`       |     20 |       20 |
| `operating_telemetry`   |     21 |       21 |
| `vendor_contracts`      |     38 |       38 |
| `compliance`            |     12 |       12 |
| `industry_context`      |     10 |       10 |
| `cross_program_signals` |     12 |       12 |

Embedding run summary:

- Embedded: 526
- Failed: 0
- Batches: 3
- Tokens: 78,679
- Cost: $0.001574
- Pinecone upsert: 0 (`--postgres-only`)

## Verifier Evidence

Deterministic Apex verifier:

- Command: `npm run verify:apex-sentinel-canonical`
- Result: 12/12 passed
- Mode: `substrate_backed_canonical_harness`
- Tenant grounded: true

Live Apex Tier-1 verifier:

- Command: `npm run smoke:apex-tier1-verifier`
- Persona: `cio@apex-retail.example.com`
- Base URL: `https://app.abarva.ai`
- Result: 25/25 passed
- Gate: PASS, requires at least 22/25
- Minimum `retail-v1` chunks per answer: 5
- Minimum pattern citations per answer: 5
- p50 latency: 23,416 ms
- p95 latency: 29,130 ms
- Max latency: 30,595 ms

## Commands Run

```bash
npm run db:dry:apex-setup-data:postgres
npm run db:seed:apex-setup-data:postgres
EMBEDDING_BATCH_SIZE=256 EMBEDDING_MAX_BATCHES=3 npm run embed:pending-chunks -- --tenant apex-retail --postgres-only
npm run db:verify:apex-setup-data:postgres
npm run verify:apex-sentinel-canonical
npm run smoke:apex-tier1-verifier
```

## Known Gaps

- The setup-data loader now has a direct Postgres path. The original Supabase
  loader is retained for existing script compatibility and remains inside
  `src/scripts/setup-data`, not runtime application code.
- Full `tsc` remains blocked by the pre-existing optional dependency issue:
  `@azure/*`, `pptxgenjs`, and `@resvg/resvg-js` module resolution.
