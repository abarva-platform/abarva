# SkyHarbor Source Layer And Cube Proof

SYNTHETIC DEMO DATA - NOT CLIENT DATA - OFFLINE LAYER/CUBE PROOF ONLY

Input package: `reports/source-golden-contract-production-reconciled-v2-20260811`.

This is a local/offline population of the four Enterprise Information Architecture layers plus a cube-style proof. It does not load Northgate Cloud/Postgres, update Active Tenant Access, backfill retrieval indexes, deploy, or make a live-client claim.

## Produced Layers

- Layer 1 client intake: copied reviewed source extracts, documents, source manifest.
- Layer 2 source adapters: adapter run registry and emitted canonical-object lineage.
- Layer 3 canonical: local canonical objects for contracts, vendors, documents, clauses, pricing, invoices, SLAs, usage, cloud, VMS, opportunities, facts, conflicts, reviews, approvals, finance, and learning.
- Layer 4 read models: Source portfolio, Contract 360, opportunities, evidence gates, New Event learning, and Tower value projection.
- Cube: contract cube, dimensions, measures, and gate flags.

## Counts

- Source extract CSVs: 25
- Total input CSV rows including depth review: 1165
- Documents: 30
- Adapter emitted objects: 1117
- Cube rows: 362

## Gate Intent

- `CTR-090` remains the action-ready hero fixture.
- `CTR-061` remains the governed conflict-control fixture.
