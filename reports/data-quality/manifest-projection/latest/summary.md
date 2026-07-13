# DATA-PR31 Tenant Manifest Completeness and Source Projection Audit

Generated: 2026-07-13T21:33:26.523Z

## Truth split

- Implemented: all-tenant manifest completeness audit, source projection audit, stranded-source detection, adapter/mapping gap detection, Home/aVa representation warnings, Admin visibility.
- Not implemented: source remediation, candidate regeneration, production writes, candidate promotion, Active Tenant Access update, module runtime behavior changes.

## Guardrails

- productionTenantDataWritten: false
- candidatePromoted: false
- activeTenantAccessLayerUpdated: false
- moduleRuntimeBehaviorChanged: false
- activeTenantTruthChanged: false

## Upload path alignment

- Target process: Admin creates a tenant-scoped upload session, files land in Azure Blob, an ACA data-build job reads that exact session, and the proof bundle records every accepted/quarantined source file.
- Canonical landing: context-landing/landing/<uploadSessionId>/<segmentKey>/<fileName>
- Current loader landing: context-landing/landing/<tenantKey>/inbox/<uuid>-<fileName>
- Legacy staging container: context-drops
- Admin upload alignment: not_fully_aligned
- Loader kickoff: The current loader can scan context-landing under landing/<tenantKey>/, while legacy manifest-load paths stage committed files to context-drops.
- Required correction: Make admin upload, tenant packet manifest, source projection audit, and ACA data-build job use the same upload session id, segment key, source manifest, and proof bundle before any candidate regeneration or promotion.

## Tenant summary

| Tenant | Status | Source files | Structured rows | Manifest files | Included files | Candidate records | Home rows | Blockers |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Airline Demo | blocked | 393 | 58,648 | 3 | 2 | 53 | 31,316 | 19 |
| Healthcare Demo | blocked | 401 | 22,184 | 0 | 0 | 0 | 7,557 | 19 |
| Financial Services Demo | blocked | 339 | 25,961 | 0 | 0 | 0 | 16,591 | 19 |
| Retail Demo | blocked | 259 | 17,548 | 0 | 0 | 0 | 7,404 | 20 |
| Lakeshore Holdings | blocked | 283 | 16,617 | 0 | 0 | 0 | 1,239 | 20 |

## Excluded tenants

- northstar-clinical: Retired/excluded per operator instruction for this data-layer proof; do not process as an active tenant.

## SkyHarbor required findings

| Required item | Accessible | Included in candidate manifest | Rows | Path |
| --- | --- | --- | ---: | --- |
| 412-app portfolio CSV from Downloads | true | false | 412 | /Users/anand/Downloads/SkyHarbor-E2E-Data/01-evidence-uploads/01_Application_Portfolio_InScope_412Apps.csv |
| 900-row older app/system estate | true | false | 900 | datasets/skyharbor-air-synthetic-v4/family-2-technology-estate/F05_applications-systems.csv |
| 956-row transformed app/system template | true | false | 956 | datasets/skyharbor-air-synthetic-v6/templates/V6_05_applications_systems.csv |
| 13-row current upgrade candidate app/system file | true | false | 13 | datasets/skyharbor-air-v6-v7-upgrade-candidate-20260710/templates/V6_05_applications_systems.csv |
