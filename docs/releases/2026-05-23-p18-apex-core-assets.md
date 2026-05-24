# P18 Apex Core Data Assets

## Impact

Extends the Apex Retail Packet 18 synthetic data pack from the initial scaffold into a multi-surface core substrate. The pack now covers vendor spend, renewal posture, 30 active initiatives, 12 closed initiatives, 1,420 roles, DORA baselines, DevEx, AI-tool usage, sponsor signal, incidents, regulatory scope, benchmarks, Watchlist expectations, and financial-rollup expectations.

This still does not change runtime behavior until the ingestion pipeline and DB loader slices land. It makes the next slices safer because they can validate against committed file contracts instead of local-only references.

## Validation

- `npm run verify:apex-data-pack`

The verifier now asserts:

- 120 application rows
- 320 integration edges
- 45 vendor contracts
- 12 infrastructure/managed-service contracts
- 30 active initiatives and 12 closed initiatives
- 1,420 role rows
- 84 DORA baseline rows
- 56 major incidents, 28 problem records, and 180 change records
- $198.9M vendor spend and $98.89M active initiative commitments
- seven seeded Watchlist expectations
- regulatory scope counts for PCI, SOX, CCPA, ADA, employee, and customs

## Scope

Included:

- core CSV/JSON data families under `datasets/apex-retail-synthetic-v1/`
- stronger deterministic verifier
- updated manifest, row-count contract, README, and changelog

Not included:

- PDF mock contracts and charters
- XLSX binary workbook generation
- client corpus chunk/data-source generation
- onboarding upload, parse, validate, confirm, and store pipeline
- live Sentinel canonical execution harness
