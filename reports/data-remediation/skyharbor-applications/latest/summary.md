# DATA-PR32 SkyHarbor Applications & Systems Candidate Regeneration

Generated: 2026-07-13T00:00:00.000Z

## Truth split

- Implemented: source selection, applications/systems mapping, inactive candidate regeneration, evidence attachment, relationship candidate planning, quality/quarantine reports, Admin visibility.
- Not implemented: production writes, candidate promotion, Active Tenant Access update, default Home update, runtime module consumption change, all-domain SkyHarbor remediation.

## Selected source

- 900-row older app/system estate
- Path: datasets/skyharbor-air-synthetic-v4/family-2-technology-estate/F05_applications-systems.csv
- Rows: 900
- Reason: Selected because it has unique application/system names, IDs, owners, business functions, deployment, lifecycle, criticality, run cost, data class, and integration counts. It is the cleanest application/system inventory for this one-domain remediation.

## Counts

- Accepted candidate records: 900
- Warning candidate records: 0
- Quarantined rows: 0
- Canonical ingestion records: 900
- Evidence references attached: 900
- Relationship candidates planned: 4500
- Source conflicts reported: 1312

## Guardrails

- productionTenantDataWritten: false
- candidatePromoted: false
- activeTenantAccessLayerUpdated: false
- moduleRuntimeConsumptionChanged: false
- activeHomeContextChanged: false
- realizedValueClaimed: false

## Promotion blockers

- Candidate preview only; active promotion is out of scope for DATA-PR32.
- Selected source is synthetic demo-safe source, not real SkyHarbor production data.
- Upload landing path alignment remains open for DATA-PR33 before production data-build use.
- Operator/source-owner approval is required before any candidate can become active tenant truth.
- 1312 source conflicts were reported and not merged.
